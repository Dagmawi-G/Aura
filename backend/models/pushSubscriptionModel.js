import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  expirationTime: { type: Number, default: null },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  adminName: { type: String, default: "Admin" },
  createdAt: { type: Date, default: Date.now }
});

const pushSubscriptionModel = 
  mongoose.models.pushSubscription || 
  mongoose.model("pushSubscription", pushSubscriptionSchema);

export default pushSubscriptionModel;
