import mongoose from "mongoose";

const stickerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, default: "General" },
  stickerType: { type: String, enum: ["Mix", "Fixed"], default: "Mix" },
  stockQuantity: { type: Number, default: 50, min: 0 },
  createdAt: { type: Date, default: Date.now }
});

const stickerModel = mongoose.models.sticker || mongoose.model("sticker", stickerSchema);

export default stickerModel;
