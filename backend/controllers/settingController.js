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
        deliveryTiers: { under5: 200, between5and10: 350, between10and15: 500, over15: 700 },
        urgentFee: 100,
        storePhone: "+251 911 223 344",
        prepaymentPerItem: 500,
        currency: "ETB",
        paymentMethods: defaultPaymentMethods
      });
      await settings.save();
    }
    // Ensure 4 tiers exist (migrate old 3-tier records seamlessly)
    if (!settings.deliveryTiers || settings.deliveryTiers.under5 === undefined) {
      settings.deliveryTiers = {
        under5: settings.deliveryTiers?.under5 ?? 200,
        between5and10: settings.deliveryTiers?.between5and10 ?? 350,
        between10and15: settings.deliveryTiers?.between10and15 ?? 500,
        over15: settings.deliveryTiers?.over15 ?? 700
      };
      await settings.save();
    }
    if (settings.urgentFee === undefined || settings.urgentFee === null) {
      settings.urgentFee = 100;
      await settings.save();
    }
    if (!settings.storePhone) {
      settings.storePhone = "+251 911 223 344";
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
    const { storeName, storeAddress, storeCoordinates, deliveryRatePerKm, deliveryTiers, urgentFee, storePhone, prepaymentPerItem, currency, paymentMethods } = req.body;
    let settings = await settingModel.findOne({});
    if (!settings) {
      settings = new settingModel({
        storeName, storeAddress, storeCoordinates,
        deliveryRatePerKm, deliveryTiers, urgentFee, storePhone, prepaymentPerItem,
        currency, paymentMethods
      });
    } else {
      if (storeName !== undefined) settings.storeName = storeName;
      if (storeAddress !== undefined) settings.storeAddress = storeAddress;
      if (storeCoordinates !== undefined) settings.storeCoordinates = storeCoordinates;
      if (deliveryRatePerKm !== undefined) settings.deliveryRatePerKm = Number(deliveryRatePerKm);
      if (deliveryTiers !== undefined) {
        settings.deliveryTiers = {
          under5: Number(deliveryTiers.under5) || 200,
          between5and10: Number(deliveryTiers.between5and10) || 350,
          between10and15: Number(deliveryTiers.between10and15) || 500,
          over15: Number(deliveryTiers.over15) || 700
        };
      }
      if (urgentFee !== undefined) settings.urgentFee = Number(urgentFee);
      if (storePhone !== undefined) settings.storePhone = storePhone;
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
