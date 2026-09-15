import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema({
  provider: { type: String, required: true }, // e.g. Telebirr, CBE, Bank of Abyssinia
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  qrCode: { type: String, default: "" },
  active: { type: Boolean, default: true },
  instructions: { type: String, default: "" }
});

const settingSchema = new mongoose.Schema({
  storeName: { type: String, default: "Aura collection" },
  storeAddress: { type: String, default: "Bole Medhanialem, Addis Ababa, Ethiopia" },
  storeCoordinates: {
    lat: { type: Number, default: 8.9956 },
    lng: { type: Number, default: 38.7891 }
  },
  // Legacy field kept for backward compatibility
  deliveryRatePerKm: { type: Number, default: 25 },
  // Tiered delivery fees (configurable by admin)
  deliveryTiers: {
    under10: { type: Number, default: 300 },       // < 10 km
    between10and20: { type: Number, default: 500 }, // 10 - 20 km
    over20: { type: Number, default: 700 }          // > 20 km
  },
  // Minimum prepayment (ቀብድ) per item
  prepaymentPerItem: { type: Number, default: 500 },
  currency: { type: String, default: "ETB" },
  paymentMethods: [paymentMethodSchema]
}, { timestamps: true });

const settingModel = mongoose.models.setting || mongoose.model("setting", settingSchema);

export default settingModel;
