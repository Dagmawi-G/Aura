import orderModel from "../models/orderModel.js";

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

    // Generate unique order number (e.g., AUR-9482)
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `AUR-${new Date().getFullYear().toString().slice(-2)}${randomCode}`;

    const newOrder = new orderModel({
      orderNumber: orderNumber,
      customerName: req.body.customerName || "Guest Customer",
      customerPhone: req.body.customerPhone || "",
      customerEmail: req.body.customerEmail || "",
      deliveryType: req.body.deliveryType || "Delivery",
      deliveryAddress: req.body.deliveryAddress || "",
      customerCoordinates: customerCoordinates,
      distanceKm: Number(req.body.distanceKm) || 0,
      deliveryFee: Number(req.body.deliveryFee) || 0,
      items: items,
      subtotal: Number(req.body.subtotal) || 0,
      totalAmount: Number(req.body.totalAmount) || 0,
      prepaymentAmount: Number(req.body.prepaymentAmount) || 0,
      paymentMethod: req.body.paymentMethod || "Bank / Mobile Transfer",
      paymentAccount: req.body.paymentAccount || "",
      paymentProof: paymentProofFilename,
      notes: req.body.notes || "",
      status: "Pending Verification"
    });


    await newOrder.save();
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
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { status: status },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, message: "Order status updated", data: updatedOrder });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, message: "Error updating status" });
  }
};

// Track order by Order Number or Phone Number
const trackOrder = async (req, res) => {
  try {
    const { query } = req.params;
    if (!query) {
      return res.status(400).json({ success: false, message: "Please provide order ID or phone number" });
    }

    const trimmedQuery = query.trim();
    // Search by orderNumber or phone
    const orders = await orderModel.find({
      $or: [
        { orderNumber: { $regex: new RegExp(`^${trimmedQuery}$`, "i") } },
        { customerPhone: trimmedQuery }
      ]
    }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: "No orders found matching your search" });
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error tracking order:", error);
    res.status(500).json({ success: false, message: "Error tracking order" });
  }
};

export { submitGuestOrder, listOrders, updateStatus, trackOrder };
