import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose"; // Add this import
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Optional: Log when models are registered
mongoose.connection.once('open', () => {
  console.log("MongoDB connected. Registered models:", Object.keys(mongoose.models));
});

app.use("/api/auth", authRoutes);

// Test endpoint to check task model
app.get("/api/check-models", (req, res) => {
  res.json({
    models: Object.keys(mongoose.models),
    hasTask: !!mongoose.models.Task
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));