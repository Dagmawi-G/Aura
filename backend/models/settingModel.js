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
  // Tiered delivery fees (4 categories: <5km, 5-10km, 10-15km, >15km)
  deliveryTiers: {
    under5: { type: Number, default: 200 },         // < 5 km
    between5and10: { type: Number, default: 350 },  // 5 - 10 km
    between10and15: { type: Number, default: 500 }, // 10 - 15 km
    over15: { type: Number, default: 700 }          // > 15 km
  },
  // Extra surcharge for urgent same-day order
  urgentFee: { type: Number, default: 100 },
  // Store contact phone for urgent order notifications
  storePhone: { type: String, default: "+251 911 223 344" },
  // Minimum prepayment (ቀብድ) per item
  prepaymentPerItem: { type: Number, default: 500 },
  currency: { type: String, default: "ETB" },
  paymentMethods: [paymentMethodSchema]
}, { timestamps: true });

const settingModel = mongoose.models.setting || mongoose.model("setting", settingSchema);

export default settingModel;
