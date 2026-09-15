import settingModel from "../models/settingModel.js";

const defaultPaymentMethods = [
  {
    provider: "Telebirr",
    accountName: "Aura Collection Merch",
    accountNumber: "0911223344",
    active: true,
    instructions: "Send via Telebirr transfer and attach the transaction receipt."
  },
  {
    provider: "CBE (Commercial Bank of Ethiopia)",
    accountName: "Aura Collection / Merch PLC",
    accountNumber: "1000123456789",
    active: true,
    instructions: "Transfer to CBE account and take a screenshot of the completed transfer confirmation."
  },
  {
    provider: "Bank of Abyssinia",
    accountName: "Aura Collection",
    accountNumber: "28374829",
    active: true,
    instructions: "Transfer via BoA mobile or banking app."
  }
];

// Get Settings
const getSettings = async (req, res) => {
  try {
    let settings = await settingModel.findOne({});
    if (!settings) {
      settings = new settingModel({
        storeName: "Aura collection",
        storeAddress: "Bole Medhanialem, Addis Ababa, Ethiopia",
        storeCoordinates: { lat: 8.9956, lng: 38.7891 },
        deliveryRatePerKm: 25,
        deliveryTiers: { under10: 300, between10and20: 500, over20: 700 },
        prepaymentPerItem: 500,
        currency: "ETB",
        paymentMethods: defaultPaymentMethods
      });
      await settings.save();
    }
    // Ensure tiers exist (migrate old records)
    if (!settings.deliveryTiers || !settings.deliveryTiers.under10) {
      settings.deliveryTiers = { under10: 300, between10and20: 500, over20: 700 };
      await settings.save();
    }
    if (settings.prepaymentPerItem === undefined || settings.prepaymentPerItem === null) {
      settings.prepaymentPerItem = 500;
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ success: false, message: "Error fetching settings" });
  }
};

// Update Settings
const updateSettings = async (req, res) => {
  try {
    const { storeName, storeAddress, storeCoordinates, deliveryRatePerKm, deliveryTiers, prepaymentPerItem, currency, paymentMethods } = req.body;
    let settings = await settingModel.findOne({});
    if (!settings) {
      settings = new settingModel({
        storeName, storeAddress, storeCoordinates,
        deliveryRatePerKm, deliveryTiers, prepaymentPerItem,
        currency, paymentMethods
      });
    } else {
      if (storeName !== undefined) settings.storeName = storeName;
      if (storeAddress !== undefined) settings.storeAddress = storeAddress;
      if (storeCoordinates !== undefined) settings.storeCoordinates = storeCoordinates;
      if (deliveryRatePerKm !== undefined) settings.deliveryRatePerKm = Number(deliveryRatePerKm);
      if (deliveryTiers !== undefined) settings.deliveryTiers = {
        under10: Number(deliveryTiers.under10) || 300,
        between10and20: Number(deliveryTiers.between10and20) || 500,
        over20: Number(deliveryTiers.over20) || 700
      };
      if (prepaymentPerItem !== undefined) settings.prepaymentPerItem = Number(prepaymentPerItem);
      if (currency !== undefined) settings.currency = currency;
      if (paymentMethods !== undefined) settings.paymentMethods = paymentMethods;
    }
    await settings.save();
    res.json({ success: true, message: "Settings updated successfully", data: settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ success: false, message: "Error updating settings" });
  }
};

export { getSettings, updateSettings };
