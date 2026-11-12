import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // Sign-in identifier. Uniqueness ignores case (see the index below).
    username: { type: String, trim: true },
    // Optional contact detail; no longer used to sign in
    email: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin" },
    cartData: { type: Object, default: {} },
  },
  // Indexes are applied with syncIndexes() after connecting, so the old required-email index gets replaced
  { timestamps: true, minimize: false, autoIndex: false }
);

// "Admin" and "admin" are the same account
export const USERNAME_COLLATION = { locale: "en", strength: 2 };
userSchema.index(
  { username: 1 },
  { unique: true, collation: USERNAME_COLLATION, partialFilterExpression: { username: { $type: "string" } } }
);

export const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,30}$/;

const userModel =
  mongoose.models.user || mongoose.model("user", userSchema, "users");

export default userModel;

