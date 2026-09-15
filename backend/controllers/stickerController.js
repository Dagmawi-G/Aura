import stickerModel from "../models/stickerModel.js";
import fs from "fs";

// Add Sticker
const addSticker = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Sticker image is required" });
    }
    const imageFilename = req.file.filename;
    const sticker = new stickerModel({
      name: req.body.name || "Custom Sticker",
      category: req.body.category || "General",
      image: imageFilename
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

// Remove Sticker
const removeSticker = async (req, res) => {
  try {
    const stickerId = req.body.id;
    const sticker = await stickerModel.findById(stickerId);
    if (!sticker) {
      return res.status(404).json({ success: false, message: "Sticker not found" });
    }
    if (fs.existsSync(`uploads/${sticker.image}`)) {
      fs.unlink(`uploads/${sticker.image}`, () => {});
    }
    await stickerModel.findByIdAndDelete(stickerId);
    res.json({ success: true, message: "Sticker removed successfully" });
  } catch (error) {
    console.error("Error removing sticker:", error);
    res.status(500).json({ success: false, message: "Error removing sticker" });
  }
};

export { addSticker, listStickers, removeSticker };
