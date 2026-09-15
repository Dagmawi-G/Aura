import mongoose from "mongoose";

const stickerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, default: "General" },
  createdAt: { type: Date, default: Date.now }
});

const stickerModel = mongoose.models.sticker || mongoose.model("sticker", stickerSchema);

export default stickerModel;
