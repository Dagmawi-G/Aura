import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel, { USERNAME_COLLATION, USERNAME_PATTERN } from "./models/userModel.js";
import "dotenv/config";
import readline from "readline";

// Usage: npm run create-admin [-- <username> <password>]
// Creates an admin, or resets the password of the admin with that username.
// Default username: "Admin".

const DEFAULT_USERNAME = "Admin";

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

    // Apply the username index and replace the old required-email index
    await userModel.syncIndexes();

    const args = process.argv.slice(2);
    let username = args[0];
    let password = args[1];

    if (!password) {
      console.log("--- Create Admin Account / Reset Admin Password ---");
      username =
        username ||
        (await askQuestion(`Enter Admin Username (default: ${DEFAULT_USERNAME}): `)) ||
        DEFAULT_USERNAME;
      password = await askQuestion("Enter Admin Password (min 8 chars): ");
    }

    username = String(username || DEFAULT_USERNAME).trim();

    if (!USERNAME_PATTERN.test(username)) {
      console.error("Error: Username must be 3-30 characters: letters, numbers, dot, dash or underscore.");
      process.exit(1);
    }

    if (!password || password.length < 8) {
      console.error("Error: Password must be at least 8 characters long.");
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

    let account = await userModel.findOne({ username }).collation(USERNAME_COLLATION);

    // Older admins signed in with an email and have no username yet.
    // If there is exactly one, give it this username instead of creating a second account.
    if (!account) {
      const legacyAdmins = await userModel.find({ role: "admin", username: { $exists: false } });
      if (legacyAdmins.length === 1) {
        account = legacyAdmins[0];
        console.log(`\nConverting existing email-based admin (${account.email || account.name}) to username sign-in.`);
      }
    }

    if (account) {
      account.username = username;
      account.name = username;
      account.role = "admin";
      account.password = hashedPassword;
      await account.save();
      console.log(`\nSuccess: Admin "${username}" updated with the new password.`);
    } else {
      await new userModel({
        name: username,
        username,
        password: hashedPassword,
        role: "admin",
      }).save();
      console.log(`\nSuccess: New admin "${username}" created.`);
    }

    console.log(`Username: ${username}`);
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
