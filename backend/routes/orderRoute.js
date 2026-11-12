import express from "express";
import {
  requireDb,
  submitGuestOrder,
  listOrders,
  updateStatus,
  trackOrder,
  getVapidPublicKeyHandler,
  subscribePushHandler,
  testPushHandler
} from "../controllers/orderController.js";
import { upload } from "../middleware/multerConfig.js";
import { adminAuth } from "../middleware/auth.js";

const orderRouter = express.Router();

// Public (storefront)
orderRouter.post("/submit", requireDb, upload.single("paymentProof"), submitGuestOrder);
orderRouter.get("/track/:query", requireDb, trackOrder);
orderRouter.get("/vapid-key", getVapidPublicKeyHandler);

// Admin only
orderRouter.get("/list", adminAuth, listOrders);
orderRouter.post("/status", adminAuth, updateStatus);
orderRouter.post("/subscribe-push", adminAuth, subscribePushHandler);
orderRouter.post("/test-push", adminAuth, testPushHandler);

export default orderRouter;