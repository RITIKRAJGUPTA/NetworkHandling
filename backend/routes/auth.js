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
      password: hashedPassword,
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

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({ token, role: user.role, name: user.name, userId: user._id }); // Added userId
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// FORGOT PASSWORD
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

// RESET PASSWORD
router.post("/reset-password/:token", async (req, res) => {
  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpires: { $gt: Date.now() },
  });

  if (!user) return res.json({ message: "Invalid or expired token" });

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;

  await user.save();

  res.json({ message: "Password reset successful" });
});

// GET TEAM LEADS
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

// Middleware to verify JWT token
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.id;
    req.userRole = verified.role;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// GET user profile by ID
router.get("/profile/:userId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password -resetToken -resetTokenExpires")
      .populate("teamLead", "name email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is requesting their own profile or is admin
    if (user._id.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized to view this profile" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE user profile
router.put("/profile/:userId", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gender,
      designation,
      teamLead,
      address,
      dateOfBirth,
      emergencyContact,
      bankDetails,
    } = req.body;

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check permissions
    const isSelf = user._id.toString() === req.userId;
    const isAdmin = req.userRole === "admin";
    const isManager = req.userRole === "manager";
    
    // Check if manager is trying to update non-employee
    if (isManager && user.role !== "employee") {
      return res.status(403).json({ message: "Managers can only update employee profiles" });
    }
    
    // Allow if: self update, admin, or manager updating employee
    if (!isSelf && !isAdmin && !(isManager && user.role === "employee")) {
      return res.status(403).json({ message: "Unauthorized to update this profile" });
    }

    // Update only allowed fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;
    if (designation) user.designation = designation;
    if (teamLead) user.teamLead = teamLead;
    if (address) user.address = address;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (emergencyContact) {
      user.emergencyContact = {
        name: emergencyContact.name || user.emergencyContact?.name,
        phone: emergencyContact.phone || user.emergencyContact?.phone,
        relationship: emergencyContact.relationship || user.emergencyContact?.relationship,
      };
    }
    if (bankDetails) {
      user.bankDetails = {
        accountNumber: bankDetails.accountNumber || user.bankDetails?.accountNumber,
        bankName: bankDetails.bankName || user.bankDetails?.bankName,
        ifscCode: bankDetails.ifscCode || user.bankDetails?.ifscCode,
      };
    }

    await user.save();

    // Return user without sensitive data
    const updatedUser = await User.findById(user._id).select("-password -resetToken -resetTokenExpires");
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CHANGE PASSWORD
router.put("/change-password/:userId", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is changing their own password
    if (user._id.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized to change this password" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all users (Admin, Manager, Hr)
router.get("/users", authMiddleware, async (req, res) => {
  try {
    // Allow admin, hr, and manager
    const allowedRoles = ["admin", "hr", "manager"];

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ message: "Access denied. Admin, HR, or Manager only." });
    }

    const users = await User.find()
      .select("-password -resetToken -resetTokenExpires")
      .populate("teamLead", "name email");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET users by role (Admin/HR only)
router.get("/users/role/:role", authMiddleware, async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ["admin", "hr", "employer", "manager", "employee"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Allow admin or HR to access this endpoint
    if (req.userRole !== "admin" && req.userRole !== "hr") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find({ role })
      .select("-password -resetToken -resetTokenExpires")
      .populate("teamLead", "name email");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE user role 
router.put("/users/:userId/role", authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["admin", "hr", "employer", "manager", "employee"];

    // Only admin can change roles
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Only admin can update roles" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    user.role = role;
    await user.save();

    res.json({ message: "User role updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE user 
router.delete("/users/:userId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self delete
    if (user._id.toString() === req.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    // Permission checks
    if (req.userRole === "admin") {
      // Admin can delete any user except themselves
      await User.findByIdAndDelete(req.params.userId);
      return res.json({ message: "User deleted successfully" });
    }
    
    if (req.userRole === "manager") {
      // Manager can only delete employees
      if (user.role !== "employee") {
        return res.status(403).json({ message: "Managers can only delete employee accounts" });
      }
      await User.findByIdAndDelete(req.params.userId);
      return res.json({ message: "Employee deleted successfully" });
    }
    
    if (req.userRole === "hr") {
      // HR can delete employees and maybe other roles (configure as needed)
      if (user.role === "admin") {
        return res.status(403).json({ message: "HR cannot delete admin users" });
      }
      await User.findByIdAndDelete(req.params.userId);
      return res.json({ message: "User deleted successfully" });
    }
    
    return res.status(403).json({ message: "Access denied. Insufficient permissions." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;