import userModel, { USERNAME_COLLATION, USERNAME_PATTERN } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Create token helper
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ==========================================
// ── ADMIN AUTHENTICATION & MANAGEMENT ─────
// ==========================================

// Admin Login
const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const user = await userModel
      .findOne({ username: username.trim() })
      .collation(USERNAME_COLLATION);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    // Only existing admins may sign in here; an account is never promoted by logging in
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Administrator privileges required." });
    }

    const token = createToken(user._id);
    res.json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: "admin"
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// List all Admin Accounts from 'users' table (Protected)
const listAdminAccounts = async (req, res) => {
  try {
    const admins = await userModel
      .find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: admins });
  } catch (error) {
    console.error("List admins error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin accounts from users table" });
  }
};

// Create a New Admin Account (Protected)
const createAdminAccount = async (req, res) => {
  const { name, username, password } = req.body;
  try {
    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const cleanUsername = username.trim();
    if (!USERNAME_PATTERN.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: "Username must be 3-30 characters: letters, numbers, dot, dash or underscore"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const existing = await userModel.findOne({ username: cleanUsername }).collation(USERNAME_COLLATION);
    if (existing) {
      return res.status(400).json({ success: false, message: "This username is already taken" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new userModel({
      name: typeof name === "string" && name.trim() ? name.trim() : cleanUsername,
      username: cleanUsername,
      password: hashedPassword,
      role: "admin"
    });

    const saved = await newAdmin.save();
    res.json({
      success: true,
      message: "New Administrator created successfully",
      admin: { id: saved._id, name: saved.name, username: saved.username, role: "admin", createdAt: saved.createdAt }
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ success: false, message: "Error creating admin account" });
  }
};

// Delete Admin Account (Protected)
const deleteAdminAccount = async (req, res) => {
  try {
    const adminIdToDelete = req.params.id;

    if (!adminIdToDelete) {
      return res.status(400).json({ success: false, message: "Admin ID is required" });
    }

    // Safety check 1: Cannot delete your own logged-in account
    if (req.admin.id.toString() === adminIdToDelete.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own active administrator account"
      });
    }

    // Safety check 2: Must have at least 1 admin remaining
    const totalAdmins = await userModel.countDocuments({ role: "admin" });
    if (totalAdmins <= 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the last remaining administrator account"
      });
    }

    const target = await userModel.findById(adminIdToDelete);
    if (!target || target.role !== "admin") {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    await userModel.findByIdAndDelete(adminIdToDelete);
    res.json({ success: true, message: `Admin account (${target.username || target.name}) deleted successfully` });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({ success: false, message: "Failed to delete admin account" });
  }
};


export {
  adminLogin,
  listAdminAccounts,
  createAdminAccount,
  deleteAdminAccount
};

