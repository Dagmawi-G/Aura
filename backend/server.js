import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import settingRouter from "./routes/settingRoute.js";
import stickerRouter from "./routes/stickerRoute.js";
import orderRouter from "./routes/orderRoute.js";
import { ensureDefaultAdmin } from "./controllers/userController.js";
import { startKeepAlive } from "./utils/keepAlive.js";
import "dotenv/config";

// App config
const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());

// DB connection & default super admin setup
connectDB().then(() => {
  ensureDefaultAdmin();
});

// Health check / Keep-Alive ping endpoints (to prevent Render from sleeping)
const handlePing = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Aura Backend is awake & operational",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

app.get("/api/ping", handlePing);
app.get("/ping", handlePing);
app.get("/health", handlePing);

// API endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/setting", settingRouter);
app.use("/api/sticker", stickerRouter);
app.use("/api/order", orderRouter);
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("Aura Collection API Working");
});

app.listen(port, () => {
  console.log(`Server Started on port: ${port}`);
  // Start Render keep-alive self-ping background worker
  startKeepAlive(port);
});

