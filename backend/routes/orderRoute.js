import express from "express";
import {
  submitGuestOrder,
  listOrders,
  updateStatus,
  trackOrder,
  getVapidPublicKeyHandler,
  subscribePushHandler,
  testPushHandler
} from "../controllers/orderController.js";
import { upload } from "../middleware/multerConfig.js";

const orderRouter = express.Router();

orderRouter.post("/submit", upload.single("paymentProof"), submitGuestOrder);
orderRouter.get("/list", listOrders);
orderRouter.post("/status", updateStatus);
orderRouter.get("/track/:query", trackOrder);
orderRouter.get("/vapid-key", getVapidPublicKeyHandler);
orderRouter.post("/subscribe-push", subscribePushHandler);
orderRouter.post("/test-push", testPushHandler);

export default orderRouter;