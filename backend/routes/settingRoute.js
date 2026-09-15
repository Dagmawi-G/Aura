import express from "express";
import { getSettings, updateSettings } from "../controllers/settingController.js";

const settingRouter = express.Router();

settingRouter.get("/", getSettings);
settingRouter.post("/update", updateSettings);

export default settingRouter;
