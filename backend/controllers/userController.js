import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

// Create token helper
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "aura_jwt_secret_key_2026", { expiresIn: "7d" });
};

// ==========================================
// ── CUSTOMER LOGIN & REGISTRATION ─────────
// ==========================================

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required" });
    }
    const user = await userModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    const role = user.role;
    const token = createToken(user._id);
    res.json({
      success: true,
      token,
      role,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};

// Register user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.json({ success: false, message: "All fields are required" });
    }
    const exists = await userModel.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.json({ success: false, message: "User already exists with this email" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email address" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "Password must be at least 8 characters long" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "user"
    });

    const user = await newUser.save();
    const token = createToken(user._id);
    res.json({
      success: true,
      token,
      role: user.role,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
};

// ==========================================
// ── ADMIN AUTHENTICATION & MANAGEMENT ─────
// ==========================================

// Admin Login
const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await userModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Account not found in users table" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Ensure role is admin
    if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const token = createToken(user._id);
    res.json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
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
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await userModel.findOne({ email: normalizedEmail });

    if (existing) {
      if (existing.role === "admin") {
        return res.status(400).json({ success: false, message: "An admin with this email already exists" });
      }
      // Promote existing user to admin
      const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
      existing.password = await bcrypt.hash(password, salt);
      existing.role = "admin";
      existing.name = name.trim();
      await existing.save();

      return res.json({
        success: true,
        message: "Existing account promoted to Admin successfully",
        admin: { id: existing._id, name: existing.name, email: existing.email, role: "admin" }
      });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new userModel({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin"
    });

    const saved = await newAdmin.save();
    res.json({
      success: true,
      message: "New Administrator created successfully",
      admin: { id: saved._id, name: saved.name, email: saved.email, role: "admin", createdAt: saved.createdAt }
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
    res.json({ success: true, message: `Admin account (${target.email}) deleted successfully` });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({ success: false, message: "Failed to delete admin account" });
  }
};

// Ensure at least one default super-admin exists in the DB
const ensureDefaultAdmin = async () => {
  try {
    const adminCount = await userModel.countDocuments({ role: "admin" });
    if (adminCount === 0) {
      const defaultEmail = "admin@aura.com";
      const defaultPassword = "admin12345";
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      const superAdmin = new userModel({
        name: "Aura Super Admin",
        email: defaultEmail,
        password: hashedPassword,
        role: "admin"
      });

      await superAdmin.save();
      console.log(`[AUTH SEED] Initial Super Admin created: ${defaultEmail} / ${defaultPassword}`);
    }
  } catch (err) {
    console.error("Error ensuring default admin:", err);
  }
};

export {
  loginUser,
  registerUser,
  adminLogin,
  listAdminAccounts,
  createAdminAccount,
  deleteAdminAccount,
  ensureDefaultAdmin
};

