import foodModel from "../models/foodModel.js";
import fs from "fs";

// Add Food / Product Item
const addFood = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Item photo is required" });
    }

    let stickers = [];
    if (req.body.stickers) {
      try {
        stickers = typeof req.body.stickers === "string" ? JSON.parse(req.body.stickers) : req.body.stickers;
      } catch (e) {
        stickers = [req.body.stickers];
      }
    }

    const food = new foodModel({
      name: req.body.name,
      description: req.body.description || "",
      price: Number(req.body.price),
      category: req.body.category || "General",
      image: req.file.filename,
      stickers: stickers
    });

    await food.save();
    res.json({ success: true, message: "Item added successfully", data: food });
  } catch (error) {
    console.error("Error adding food item:", error);
    res.status(500).json({ success: false, message: "Error adding item: " + error.message });
  }
};

// Update Food / Product Item
const updateFood = async (req, res) => {
  try {
    const { id, name, description, price, category } = req.body;

    const food = await foodModel.findById(id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    let stickers = food.stickers;
    if (req.body.stickers !== undefined) {
      try {
        stickers = typeof req.body.stickers === "string" ? JSON.parse(req.body.stickers) : req.body.stickers;
      } catch (e) {
        stickers = food.stickers;
      }
    }

    // If a new image was uploaded, delete the old one
    if (req.file) {
      const oldPath = `uploads/${food.image}`;
      if (fs.existsSync(oldPath)) {
        fs.unlink(oldPath, () => {});
      }
      food.image = req.file.filename;
    }

    food.name        = name        || food.name;
    food.description = description !== undefined ? description : food.description;
    food.price       = price       ? Number(price) : food.price;
    food.category    = category    || food.category;
    food.stickers    = stickers;

    await food.save();
    res.json({ success: true, message: "Item updated successfully", data: food });
  } catch (error) {
    console.error("Error updating food item:", error);
    res.status(500).json({ success: false, message: "Error updating item: " + error.message });
  }
};

// List all food items
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: foods });
  } catch (error) {
    console.error("Error listing food items:", error);
    res.status(500).json({ success: false, message: "Error fetching items" });
  }
};

// Remove food item
const removeFood = async (req, res) => {
  try {
    const foodId = req.body.id;
    const food = await foodModel.findById(foodId);
    if (!food) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    if (fs.existsSync(`uploads/${food.image}`)) {
      fs.unlink(`uploads/${food.image}`, () => {});
    }
    await foodModel.findByIdAndDelete(foodId);
    res.json({ success: true, message: "Item removed successfully" });
  } catch (error) {
    console.error("Error removing food item:", error);
    res.status(500).json({ success: false, message: "Error removing item" });
  }
};

export { addFood, updateFood, listFood, removeFood };

