import express from "express";
import {
  loginUser,
  registerUser,
  adminLogin,
  listAdminAccounts,
  createAdminAccount,
  deleteAdminAccount
} from "../controllers/userController.js";
import { adminAuth } from "../middleware/auth.js";

const userRouter = express.Router();

// Customer auth
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// Admin auth & team management
userRouter.post("/admin-login", adminLogin);
userRouter.get("/admin-list", adminAuth, listAdminAccounts);
userRouter.post("/admin-create", adminAuth, createAdminAccount);
userRouter.delete("/admin-delete/:id", adminAuth, deleteAdminAccount);

export default userRouter;

