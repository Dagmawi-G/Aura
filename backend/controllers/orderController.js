import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import stickerModel from "../models/stickerModel.js";
import foodModel from "../models/foodModel.js";
import settingModel from "../models/settingModel.js";
import fs from "fs";
import { notifyAdminsOfOrder, getVapidPublicKey, savePushSubscription } from "../services/pushService.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

// Orders are only accepted while the database is reachable, so a paid order can never be lost in memory
const requireDb = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "The store is temporarily unavailable. Please try again in a moment."
    });
  }
  next();
};

// Phone number format: 9 digits after 0, 251, or +251
const ETHIOPIAN_PHONE_REGEX = /^(?:\+251|251|0)\d{9}$/;

const MAX_ITEM_QUANTITY = 1000;

// Reject an order and discard the screenshot multer already saved for it
const rejectOrder = (req, res, message) => {
  if (req.file?.path) {
    fs.unlink(req.file.path, () => {});
  }
  return res.status(400).json({ success: false, message });
};

// Same 4 tiers the storefront shows (<5km, 5-10km, 10-15km, >15km)
const computeDeliveryFee = (distanceKm, tiers = {}) => {
  if (distanceKm <= 0) return 0;
  if (distanceKm < 5) return Number(tiers.under5) || 0;
  if (distanceKm < 10) return Number(tiers.between5and10) || 0;
  if (distanceKm <= 15) return Number(tiers.between10and15) || 0;
  return Number(tiers.over15) || 0;
};

// Turn the client's cart into order items using catalog names, prices and images from the database
const buildPricedItems = async (rawItems) => {
  let clientItems = rawItems;
  if (typeof rawItems === "string") {
    try {
      clientItems = JSON.parse(rawItems);
    } catch (e) {
      clientItems = null;
    }
  }
  if (!Array.isArray(clientItems) || clientItems.length === 0) {
    return { error: "Your cart is empty. Please add at least one item." };
  }

  const ids = clientItems.map((itm) => itm?.foodId);
  if (ids.some((id) => !id || !mongoose.Types.ObjectId.isValid(id))) {
    return { error: "Your cart contains an item we could not recognise. Please re-add it." };
  }
  const products = await foodModel.find({ _id: { $in: ids } });
  const productById = new Map(products.map((p) => [String(p._id), p]));

  const stickerIds = clientItems.flatMap((itm) =>
    Array.isArray(itm.selectedStickers) ? itm.selectedStickers.map((st) => st?.id || st?._id) : []
  );
  if (stickerIds.some((id) => !id || !mongoose.Types.ObjectId.isValid(id))) {
    return { error: "Your cart contains a sticker we could not recognise. Please re-select your stickers." };
  }
  const stickerDocs = await stickerModel.find({ _id: { $in: stickerIds } });
  const stickerById = new Map(stickerDocs.map((st) => [String(st._id), st]));

  const items = [];
  for (const itm of clientItems) {
    const product = productById.get(String(itm.foodId));
    if (!product) {
      return { error: `"${itm.name || "An item"}" is no longer available. Please remove it from your cart.` };
    }
    const quantity = Number(itm.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      return { error: `Invalid quantity for "${product.name}".` };
    }
    const selectedStickers = [];
    for (const st of Array.isArray(itm.selectedStickers) ? itm.selectedStickers : []) {
      const sticker = stickerById.get(String(st.id || st._id));
      if (!sticker) {
        return { error: `The sticker "${st.name || "you selected"}" is no longer available. Please re-select your stickers.` };
      }
      selectedStickers.push({ id: String(sticker._id), name: sticker.name, image: sticker.image });
    }
    items.push({
      foodId: String(product._id),
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
      customText: String(itm.customText || ""),
      selectedStickers
    });
  }
  return { items };
};

// How many of each sticker an order uses: sticker id -> quantity
const stickerNeedsFromItems = (items) => {
  const needs = new Map();
  for (const itm of items || []) {
    for (const st of itm.selectedStickers || []) {
      if (st.id && mongoose.Types.ObjectId.isValid(st.id)) {
        needs.set(String(st.id), (needs.get(String(st.id)) || 0) + itm.quantity);
      }
    }
  }
  return needs;
};

const releaseStickerStock = async (needs) => {
  for (const [id, qty] of needs) {
    await stickerModel.updateOne({ _id: id }, { $inc: { stockQuantity: qty } });
  }
};

// Take stock for every sticker, or take nothing. Each decrement only succeeds if enough stock is left,
// so two simultaneous orders cannot both get the last sticker.
const reserveStickerStock = async (needs, { skipDeleted = false } = {}) => {
  const ids = [...needs.keys()];
  // Stickers created before stock tracking have no quantity yet; give them the default
  await stickerModel.updateMany(
    { _id: { $in: ids }, stockQuantity: { $not: { $type: "number" } } },
    { $set: { stockQuantity: 50 } }
  );

  const taken = new Map();
  for (const [id, qty] of needs) {
    const result = await stickerModel.updateOne(
      { _id: id, stockQuantity: { $gte: qty } },
      { $inc: { stockQuantity: -qty } }
    );
    if (result.modifiedCount === 1) {
      taken.set(id, qty);
      continue;
    }
    const sticker = await stickerModel.findById(id).select("name stockQuantity");
    if (!sticker && skipDeleted) continue;
    await releaseStickerStock(taken);
    const left = sticker?.stockQuantity || 0;
    return {
      ok: false,
      message: !sticker
        ? "A selected sticker is no longer available."
        : left <= 0
          ? `The sticker "${sticker.name}" is sold out.`
          : `Only ${left} of the sticker "${sticker.name}" left, but ${qty} needed.`
    };
  }
  return { ok: true, taken };
};

// Guest Order Submission with Payment Proof
const submitGuestOrder = async (req, res) => {
  try {
    const cleanPrimaryPhone = String(req.body.customerPhone || "").trim().replace(/[\s-]/g, "");
    if (!ETHIOPIAN_PHONE_REGEX.test(cleanPrimaryPhone)) {
      return rejectOrder(req, res, "Primary phone number must have 9 digits after 0, 251, or +251");
    }

    const cleanSecondaryPhone = String(req.body.secondaryPhone || "").trim().replace(/[\s-]/g, "");
    if (cleanSecondaryPhone && !ETHIOPIAN_PHONE_REGEX.test(cleanSecondaryPhone)) {
      return rejectOrder(req, res, "Additional phone number must have 9 digits after 0, 251, or +251");
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload your transfer screenshot (Proof of Payment)"
      });
    }

    const deliveryType = req.body.deliveryType === "Pickup" ? "Pickup" : "Delivery";
    const isUrgent = req.body.isUrgent === "true" || req.body.isUrgent === true;

    // Rebuild items and every amount from the database; client-sent prices and totals are ignored
    const priced = await buildPricedItems(req.body.items);
    if (priced.error) {
      return rejectOrder(req, res, priced.error);
    }
    const items = priced.items;

    const settings = (await settingModel.findOne({})) || new settingModel();
    const distanceKm = Math.max(0, Number(req.body.distanceKm) || 0);
    const subtotal = items.reduce((sum, itm) => sum + itm.price * itm.quantity, 0);
    const totalQuantity = items.reduce((sum, itm) => sum + itm.quantity, 0);
    const deliveryFee = deliveryType === "Pickup" ? 0 : computeDeliveryFee(distanceKm, settings.deliveryTiers);
    const urgentFee = isUrgent ? Number(settings.urgentFee) || 0 : 0;
    const totalAmount = subtotal + deliveryFee + urgentFee;
    const prepaymentAmount = Math.min(totalAmount, (Number(settings.prepaymentPerItem) || 0) * totalQuantity);

    const stickerNeeds = stickerNeedsFromItems(items);
    const reservation = await reserveStickerStock(stickerNeeds);
    if (!reservation.ok) {
      return rejectOrder(req, res, `${reservation.message} Please update your cart.`);
    }

    let newOrder;
    try {
      const paymentProofFilename =
        (await uploadToCloudinary(req.file.path, "aura/receipts")) || req.file.filename;

      let customerCoordinates = { lat: 0, lng: 0 };
      if (req.body.customerCoordinates) {
        try {
          customerCoordinates = typeof req.body.customerCoordinates === "string" 
            ? JSON.parse(req.body.customerCoordinates) 
            : req.body.customerCoordinates;
        } catch (e) {}
      }

      // Auto-extract GPS coordinates if embedded in deliveryAddress (e.g. "GPS: 8.96048, 38.7106")
      if ((!customerCoordinates?.lat || !customerCoordinates?.lng) && req.body.deliveryAddress) {
        const match = req.body.deliveryAddress.match(/([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)/);
        if (match) {
          const pLat = parseFloat(match[1]);
          const pLng = parseFloat(match[2]);
          if (!isNaN(pLat) && !isNaN(pLng)) {
            customerCoordinates = { lat: pLat, lng: pLng };
          }
        }
      }

      // Generate unique order number (e.g., AUR-9482)
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `AUR-${new Date().getFullYear().toString().slice(-2)}${randomCode}`;

      newOrder = new orderModel({
        orderNumber: orderNumber,
        customerName: req.body.customerName || "Guest Customer",
        customerPhone: cleanPrimaryPhone,
        secondaryPhone: cleanSecondaryPhone,
        customerEmail: req.body.customerEmail || "",
        deliveryType: deliveryType,
        deliveryAddress: req.body.deliveryAddress || "",
        customerCoordinates: customerCoordinates,
        distanceKm: distanceKm,
        deliveryFee: deliveryFee,
        isUrgent: isUrgent,
        urgentFee: urgentFee,
        items: items,
        subtotal: subtotal,
        totalAmount: totalAmount,
        prepaymentAmount: prepaymentAmount,
        paymentMethod: req.body.paymentMethod || "Bank / Mobile Transfer",
        paymentAccount: req.body.paymentAccount || "",
        paymentProof: paymentProofFilename,
        notes: req.body.notes || "",
        deliveryDate: req.body.deliveryDate || "",
        status: "Ordered"
      });

      await newOrder.save();
    } catch (saveError) {
      // The order was not stored, so give the stickers back
      await releaseStickerStock(stickerNeeds).catch(() => {});
      throw saveError;
    }

    // Trigger website push notification to admin phone & devices
    try {
      notifyAdminsOfOrder(newOrder);
    } catch (pushErr) {
      console.warn("Could not dispatch push notification:", pushErr.message);
    }

    res.json({
      success: true,
      message: "Order submitted successfully! Proof received.",
      orderNumber: newOrder.orderNumber,
      order: newOrder
    });
  } catch (error) {
    console.error("Error submitting guest order:", error);
    res.status(500).json({ success: false, message: "Failed to submit order: " + error.message });
  }
};

// Listing orders for admin panel
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error listing orders:", error);
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
};

// Update order status
const ALLOWED_STATUSES = ["Ordered", "Payment Verified", "Completed", "Cancelled"];

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed statuses: Ordered, Payment Verified, Completed, Cancelled"
      });
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const wasCancelled = order.status === "Cancelled";
    const willBeCancelled = status === "Cancelled";
    const stickerNeeds = stickerNeedsFromItems(order.items);
    let updatedOrder;

    if (!wasCancelled && willBeCancelled) {
      // Cancelling returns the order's stickers to stock. The status filter makes sure
      // a repeated request cannot return them twice.
      updatedOrder = await orderModel.findOneAndUpdate(
        { _id: orderId, status: { $ne: "Cancelled" } },
        { status },
        { new: true }
      );
      if (updatedOrder) await releaseStickerStock(stickerNeeds);
    } else if (wasCancelled && !willBeCancelled) {
      // Re-opening a cancelled order needs its stickers again
      const reservation = await reserveStickerStock(stickerNeeds, { skipDeleted: true });
      if (!reservation.ok) {
        return res.status(409).json({
          success: false,
          message: `Cannot re-open this order. ${reservation.message}`
        });
      }
      updatedOrder = await orderModel.findOneAndUpdate(
        { _id: orderId, status: "Cancelled" },
        { status },
        { new: true }
      );
      if (!updatedOrder) await releaseStickerStock(reservation.taken);
    } else {
      updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });
    }

    // Another request changed the order first; report its current state
    if (!updatedOrder) updatedOrder = await orderModel.findById(orderId);
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.json({ success: true, message: "Order status updated", data: updatedOrder });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, message: "Error updating status" });
  }
};

// Helper to escape regex special characters
const escapeRegex = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "");

// Track order by Order Number or Phone Number
const trackOrder = async (req, res) => {
  try {
    const { query } = req.params;
    if (!query) {
      return res.status(400).json({ success: false, message: "Please provide order ID or phone number" });
    }

    const trimmedQuery = query.trim();
    const queryDigits = trimmedQuery.replace(/\D/g, "");
    const escapedQuery = escapeRegex(trimmedQuery);

    // Always match orderNumber (case-insensitive) or exact phone
    const orConditions = [
      { orderNumber: { $regex: new RegExp(`^${escapedQuery}$`, "i") } },
      { customerPhone: trimmedQuery },
      { secondaryPhone: trimmedQuery }
    ];

    if (queryDigits.length >= 8) {
      // In Ethiopian numbers (+2519... / 09... / +2517... / 07...), the last 9 digits uniquely identify subscriber
      const coreDigits = queryDigits.length >= 9 ? queryDigits.slice(-9) : queryDigits;
      // Allow optional formatting like spaces, hyphens, brackets, dots
      const digitPattern = coreDigits.split("").join("[\\s\\-\\(\\)\\.]*");
      const phoneRegex = new RegExp(digitPattern, "i");

      orConditions.push({ customerPhone: { $regex: phoneRegex } });
      orConditions.push({ secondaryPhone: { $regex: phoneRegex } });
    }

    const orders = await orderModel.find({ $or: orConditions }).sort({ createdAt: -1, date: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: "No orders found matching your search" });
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error tracking order:", error);
    res.status(500).json({ success: false, message: "Error tracking order" });
  }
};

// Get VAPID Public Key for client subscription
const getVapidPublicKeyHandler = async (req, res) => {
  try {
    const key = getVapidPublicKey();
    res.json({ success: true, publicKey: key });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving VAPID key" });
  }
};

// Subscribe admin browser to push notifications
const subscribePushHandler = async (req, res) => {
  try {
    const { subscription, adminName } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: "Subscription endpoint is required" });
    }
    await savePushSubscription(subscription, adminName || "Admin");
    res.json({ success: true, message: "Push notifications successfully enabled on this device" });
  } catch (error) {
    console.error("Error subscribing to push:", error);
    res.status(500).json({ success: false, message: "Failed to save push subscription: " + error.message });
  }
};

// Test push notification dispatch (for admin verification)
const testPushHandler = async (req, res) => {
  try {
    const isUrgent = req.body.isUrgent === true || req.body.isUrgent === "true";
    await notifyAdminsOfOrder({
      _id: "test-id",
      orderNumber: "AUR-TEST" + Math.floor(100 + Math.random() * 900),
      customerName: "Test Order Customer",
      totalAmount: 1250,
      isUrgent: isUrgent
    });
    res.json({ success: true, message: `Test push sent! (${isUrgent ? "Urgent" : "Standard"})` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Test push failed: " + error.message });
  }
};

export {
  requireDb,
  submitGuestOrder, 
  listOrders, 
  updateStatus, 
  trackOrder,
  getVapidPublicKeyHandler,
  subscribePushHandler,
  testPushHandler
};

