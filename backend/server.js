import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import settingRouter from "./routes/settingRoute.js";
import stickerRouter from "./routes/stickerRoute.js";
import orderRouter from "./routes/orderRoute.js";
import "dotenv/config";

// App config
const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());

// DB connection
connectDB();

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
});
