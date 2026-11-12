import express from "express";
import { addFood, updateFood, listFood, reorderFood, removeFood } from "../controllers/foodController.js";
import { upload } from "../middleware/multerConfig.js";
import { adminAuth } from "../middleware/auth.js";

const foodRouter = express.Router();

foodRouter.get("/list",     listFood);
foodRouter.post("/add",     adminAuth, upload.single("image"), addFood);
foodRouter.post("/update",  adminAuth, upload.single("image"), updateFood);
foodRouter.post("/reorder", adminAuth, reorderFood);
foodRouter.post("/remove",  adminAuth, removeFood);

export default foodRouter;
