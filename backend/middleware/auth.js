import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const authMiddleware = async (req, res, next) => {
  const token = req.headers.token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized. Please login." });
  }
  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = token_decode.id;
    req.userId = token_decode.id;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

const adminAuth = async (req, res, next) => {
  const token = req.headers.token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ success: false, message: "Admin access required. Please login." });
  }
  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(token_decode.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Administrator privileges required." });
    }
    req.admin = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    req.body.adminId = user._id;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({ success: false, message: "Invalid or expired admin token" });
  }
};

export { authMiddleware, adminAuth };
export default authMiddleware;

