import express from "express";
import {
  submitGuestOrder,
  listOrders,
  updateStatus,
  trackOrder
} from "../controllers/orderController.js";
import { upload } from "../middleware/multerConfig.js";

const orderRouter = express.Router();

orderRouter.post("/submit", upload.single("paymentProof"), submitGuestOrder);
orderRouter.get("/list", listOrders);
orderRouter.post("/status", updateStatus);
orderRouter.get("/track/:query", trackOrder);

export default orderRouter;