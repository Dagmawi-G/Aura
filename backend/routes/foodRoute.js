import express from "express";
import { addFood, updateFood, listFood, removeFood } from "../controllers/foodController.js";
import { upload } from "../middleware/multerConfig.js";

const foodRouter = express.Router();

foodRouter.post("/add",    upload.single("image"), addFood);
foodRouter.post("/update", upload.single("image"), updateFood);
foodRouter.get("/list",    listFood);
foodRouter.post("/remove", removeFood);

export default foodRouter;
