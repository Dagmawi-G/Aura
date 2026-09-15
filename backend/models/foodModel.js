import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, default: "General" },
  stickers: [{ type: String }], // IDs or names of attached stickers
}, { timestamps: true });

const foodModel = mongoose.models.item || mongoose.models.items || mongoose.model("item", foodSchema, "items");

export default foodModel;
