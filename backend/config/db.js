import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!mongoUrl) {
    console.error(
      "\x1b[31m[Database Error]\x1b[0m MONGO_URL is not set in backend/.env.\nPlease create backend/.env with your MongoDB connection string:\nMONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/food-del\nor local:\nMONGO_URL=mongodb://127.0.0.1:27017/food-del\n"
    );
    return;
  }
  try {
    await mongoose.connect(mongoUrl);
    console.log("\x1b[32m[Database]\x1b[0m DB Connected successfully");
  } catch (error) {
    console.error("\x1b[31m[Database Error]\x1b[0m Failed to connect to MongoDB:", error.message);
  }
};

