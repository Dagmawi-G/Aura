import stickerModel from "../models/stickerModel.js";
import fs from "fs";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

// Add Sticker
const addSticker = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Sticker image is required" });
    }
    const uploadedImage = await uploadToCloudinary(req.file.path, "aura/stickers");
    const stockQuantity = req.body.stockQuantity !== undefined && req.body.stockQuantity !== ""
      ? Math.max(0, parseInt(req.body.stockQuantity, 10) || 0)
      : 50;

    const sticker = new stickerModel({
      name: req.body.name ? req.body.name.trim() : "Custom Sticker",
      category: req.body.category || "General",
      stickerType: req.body.stickerType === "Fixed" ? "Fixed" : "Mix",
      stockQuantity: stockQuantity,
      image: uploadedImage || req.file.filename
    });
    await sticker.save();
    res.json({ success: true, message: "Sticker added successfully", data: sticker });
  } catch (error) {
    console.error("Error adding sticker:", error);
    res.status(500).json({ success: false, message: "Error adding sticker" });
  }
};

// List all stickers
const listStickers = async (req, res) => {
  try {
    const stickers = await stickerModel.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: stickers });
  } catch (error) {
    console.error("Error listing stickers:", error);
    res.status(500).json({ success: false, message: "Error fetching stickers" });
  }
};

// Update Sticker
const updateSticker = async (req, res) => {
  try {
    const { id, name, category, stickerType, stockQuantity } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: "Sticker ID is required for update" });
    }

    const sticker = await stickerModel.findById(id);
    if (!sticker) {
      return res.status(404).json({ success: false, message: "Sticker not found" });
    }

    if (name !== undefined && name.trim()) {
      sticker.name = name.trim();
    }
    if (category !== undefined) {
      sticker.category = category;
    }
    if (stickerType !== undefined) {
      sticker.stickerType = stickerType === "Fixed" ? "Fixed" : "Mix";
    }
    if (stockQuantity !== undefined && stockQuantity !== "") {
      sticker.stockQuantity = Math.max(0, parseInt(stockQuantity, 10) || 0);
    }

    // Optional replacement image
    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file.path, "aura/stickers");
      await deleteFromCloudinary(sticker.image);
      sticker.image = uploadedImage || req.file.filename;
    }

    await sticker.save();
    res.json({ success: true, message: "Sticker updated successfully", data: sticker });
  } catch (error) {
    console.error("Error updating sticker:", error);
    res.status(500).json({ success: false, message: "Error updating sticker: " + error.message });
  }
};

// Remove Sticker
const removeSticker = async (req, res) => {
  try {
    const stickerId = req.body.id;
    const sticker = await stickerModel.findById(stickerId);
    if (!sticker) {
      return res.status(404).json({ success: false, message: "Sticker not found" });
    }
    await deleteFromCloudinary(sticker.image);
    await stickerModel.findByIdAndDelete(stickerId);
    res.json({ success: true, message: "Sticker removed successfully" });
  } catch (error) {
    console.error("Error removing sticker:", error);
    res.status(500).json({ success: false, message: "Error removing sticker" });
  }
};

export { addSticker, listStickers, updateSticker, removeSticker };
