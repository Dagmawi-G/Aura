import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import { notifyAdminsOfOrder, getVapidPublicKey, savePushSubscription } from "../services/pushService.js";

// In-memory orders store fallback if MongoDB is offline
const inMemoryOrders = new Map();

// Guest Order Submission with Payment Proof
const submitGuestOrder = async (req, res) => {
  try {
    const paymentProofFilename = req.file ? req.file.filename : "";

    let items = [];
    if (req.body.items) {
      try {
        items = typeof req.body.items === "string" ? JSON.parse(req.body.items) : req.body.items;
      } catch (e) {
        items = [];
      }
    }

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

    const newOrder = new orderModel({
      orderNumber: orderNumber,
      customerName: req.body.customerName || "Guest Customer",
      customerPhone: req.body.customerPhone || "",
      secondaryPhone: req.body.secondaryPhone || "",
      customerEmail: req.body.customerEmail || "",
      deliveryType: req.body.deliveryType || "Delivery",
      deliveryAddress: req.body.deliveryAddress || "",
      customerCoordinates: customerCoordinates,
      distanceKm: Number(req.body.distanceKm) || 0,
      deliveryFee: Number(req.body.deliveryFee) || 0,
      isUrgent: req.body.isUrgent === "true" || req.body.isUrgent === true,
      urgentFee: Number(req.body.urgentFee) || 0,
      items: items,
      subtotal: Number(req.body.subtotal) || 0,
      totalAmount: Number(req.body.totalAmount) || 0,
      prepaymentAmount: Number(req.body.prepaymentAmount) || 0,
      paymentMethod: req.body.paymentMethod || "Bank / Mobile Transfer",
      paymentAccount: req.body.paymentAccount || "",
      paymentProof: paymentProofFilename,
      notes: req.body.notes || "",
      deliveryDate: req.body.deliveryDate || "",
      status: "Pending Verification"
    });

    if (mongoose.connection.readyState === 1) {
      await newOrder.save();
    } else {
      const orderData = newOrder.toObject ? newOrder.toObject() : { ...newOrder };
      orderData._id = `mem-${Date.now()}`;
      orderData.createdAt = new Date();
      orderData.updatedAt = new Date();
      inMemoryOrders.set(orderNumber, orderData);
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
    let orders = [];
    if (mongoose.connection.readyState === 1) {
      orders = await orderModel.find({}).sort({ createdAt: -1 });
    } else {
      orders = Array.from(inMemoryOrders.values()).reverse();
    }
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error listing orders:", error);
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
};

// Update order status
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (mongoose.connection.readyState === 1) {
      const updatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { status: status },
        { new: true }
      );
      if (!updatedOrder) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      return res.json({ success: true, message: "Order status updated", data: updatedOrder });
    } else {
      for (const [key, val] of inMemoryOrders.entries()) {
        if (val._id === orderId || val.orderNumber === orderId) {
          val.status = status;
          val.updatedAt = new Date();
          inMemoryOrders.set(key, val);
          return res.json({ success: true, message: "Order status updated", data: val });
        }
      }
      return res.status(404).json({ success: false, message: "Order not found" });
    }
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

    let phoneRegex = null;
    if (queryDigits.length >= 8) {
      // In Ethiopian numbers (+2519... / 09... / +2517... / 07...), the last 9 digits uniquely identify subscriber
      const coreDigits = queryDigits.length >= 9 ? queryDigits.slice(-9) : queryDigits;
      // Allow optional formatting like spaces, hyphens, brackets, dots
      const digitPattern = coreDigits.split("").join("[\\s\\-\\(\\)\\.]*");
      phoneRegex = new RegExp(digitPattern, "i");

      orConditions.push({ customerPhone: { $regex: phoneRegex } });
      orConditions.push({ secondaryPhone: { $regex: phoneRegex } });
    }

    let orders = [];

    if (mongoose.connection.readyState === 1) {
      orders = await orderModel.find({ $or: orConditions }).sort({ createdAt: -1, date: -1 });
    } else {
      const qLower = trimmedQuery.toLowerCase();
      orders = Array.from(inMemoryOrders.values()).filter((o) => {
        if (o.orderNumber && o.orderNumber.toLowerCase() === qLower) return true;
        if (o.customerPhone === trimmedQuery || o.secondaryPhone === trimmedQuery) return true;
        if (phoneRegex) {
          if (o.customerPhone && phoneRegex.test(o.customerPhone)) return true;
          if (o.secondaryPhone && phoneRegex.test(o.secondaryPhone)) return true;
        }
        return false;
      }).sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
    }

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
  submitGuestOrder, 
  listOrders, 
  updateStatus, 
  trackOrder,
  getVapidPublicKeyHandler,
  subscribePushHandler,
  testPushHandler
};

