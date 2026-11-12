import express from "express";
import { addSticker, listStickers, updateSticker, removeSticker } from "../controllers/stickerController.js";
import { upload } from "../middleware/multerConfig.js";
import { adminAuth } from "../middleware/auth.js";

const stickerRouter = express.Router();

stickerRouter.get("/list", listStickers);
stickerRouter.post("/add", adminAuth, upload.single("image"), addSticker);
stickerRouter.post("/update", adminAuth, upload.single("image"), updateSticker);
stickerRouter.post("/remove", adminAuth, removeSticker);

export default stickerRouter;
