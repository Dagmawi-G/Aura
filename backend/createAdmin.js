import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "./models/userModel.js";
import "dotenv/config";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

const createAdmin = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (!mongoUrl) {
      console.error(
        "Error: MONGO_URL or MONGODB_URI is not defined in backend/.env file."
      );
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB successfully.\n");

    const args = process.argv.slice(2);
    let name = args[0];
    let email = args[1];
    let password = args[2];

    if (!email || !password) {
      console.log("--- Create / Promote Admin Account ---");
      name = name || (await askQuestion("Enter Admin Name (e.g. Admin): ")) || "Admin";
      email = email || (await askQuestion("Enter Admin Email: "));
      password = password || (await askQuestion("Enter Admin Password (min 8 chars): "));
    }

    if (!email || !password) {
      console.error("Error: Email and password are required.");
      process.exit(1);
    }

    if (password.length < 8) {
      console.error("Error: Password must be at least 8 characters long.");
      process.exit(1);
    }

    const existingUser = await userModel.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      existingUser.role = "admin";
      if (name) existingUser.name = name;
      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash(password, salt);
      await existingUser.save();
      console.log(`\nSuccess: Existing account (${email}) has been updated with admin role and new password!`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newAdmin = new userModel({
        name: name || "Admin",
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "admin",
      });

      await newAdmin.save();
      console.log(`\nSuccess: New admin account (${email}) created successfully!`);
    }

    console.log(`Role: admin`);
    console.log(`Email: ${email.toLowerCase()}`);
    console.log(`You can now log in at the Admin panel.\n`);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin account:", error.message || error);
    process.exit(1);
  } finally {
    rl.close();
  }
};

createAdmin();
