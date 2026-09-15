import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String, default: "" },
  deliveryType: { type: String, enum: ["Delivery", "Pickup"], default: "Delivery" },
  deliveryAddress: { type: String, default: "" },
  customerCoordinates: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  distanceKm: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  items: [{
    foodId: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, default: "" },
    customText: { type: String, default: "" },
    selectedStickers: [{
      id: { type: String },
      name: { type: String },
      image: { type: String }
    }]
  }],
  subtotal: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  prepaymentAmount: { type: Number, default: 0 }, // ቀብድ paid upfront
  paymentMethod: { type: String, default: "Manual Bank Transfer" },
  paymentAccount: { type: String, default: "" },
  paymentProof: { type: String, default: "" }, // uploaded screenshot filename
  status: { 
    type: String, 
    enum: [
      "Pending Verification", 
      "Payment Verified", 
      "Processing / Printing", 
      "Out for Delivery", 
      "Ready for Pickup", 
      "Completed", 
      "Cancelled"
    ], 
    default: "Pending Verification" 
  },
  notes: { type: String, default: "" },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
