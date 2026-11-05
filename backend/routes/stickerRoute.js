import express from "express";
import { addSticker, listStickers, updateSticker, removeSticker } from "../controllers/stickerController.js";
import { upload } from "../middleware/multerConfig.js";

const stickerRouter = express.Router();

stickerRouter.post("/add", upload.single("image"), addSticker);
stickerRouter.get("/list", listStickers);
stickerRouter.post("/update", upload.single("image"), updateSticker);
stickerRouter.post("/remove", removeSticker);

export default stickerRouter;
