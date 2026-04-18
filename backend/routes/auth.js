import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import crypto from "crypto";
import nodemailer from "nodemailer";


const router = express.Router();


// REGISTER
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gender,
      role,
      password,
      designation,
      teamLead,
    } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    // ✅ THIS LINE WAS MISSING OR WRONG
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      phone,
      gender,
      role,
      designation: role === "employee" ? designation : undefined,
      teamLead:
        role === "employee" && designation !== "team lead"
          ? teamLead
          : undefined,
      password: hashedPassword, // ✅ now valid
    });

    res.json({ message: "Registered Successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
try {
const { email, password } = req.body;


const user = await User.findOne({ email });
if (!user) return res.status(400).json({ message: "Invalid credentials" });


const valid = await bcrypt.compare(password, user.password);
if (!valid) return res.status(400).json({ message: "Invalid credentials" });


const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
expiresIn: "7d",
});


res.json({ token, role: user.role, name: user.name });
} catch (err) {
res.status(500).json({ message: err.message });
}
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ message: "Email not found" });

  const token = crypto.randomBytes(32).toString("hex");

  user.resetToken = token;
  user.resetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();

  const link = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,  
    },
  });

  await transporter.sendMail({
    from: "HRMS System",
    to: email,
    subject: "Password Reset Link",
    text: `Click the link to reset your password: ${link}`,
  });

  res.json({ message: "Password reset link sent to your email" });
});
router.post("/reset-password/:token", async (req, res) => {
  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpires: { $gt: Date.now() },
  });

  if (!user) return res.json({ message: "Invalid or expired token" });

  // 🔥 Fix - Hash new password
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;

  await user.save();
  
  res.json({ message: "Password reset successful" });
});

router.get("/team-leads", async (req, res) => {
  try {
    const leads = await User.find({
      role: "employee",
      designation: "team lead",
    }).select("_id name");

    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



export default router;