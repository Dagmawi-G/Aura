import express from "express";
import { getSettings, updateSettings } from "../controllers/settingController.js";
import { adminAuth } from "../middleware/auth.js";

const settingRouter = express.Router();

settingRouter.get("/", getSettings);
settingRouter.post("/update", adminAuth, updateSettings);

export default settingRouter;
