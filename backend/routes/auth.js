import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import Task from "../models/Task.js";

const router = express.Router();
console.log("Task model loaded:", !!Task);
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

// ========== TASK MANAGEMENT ROUTES ==========

// CREATE TASK (Manager/Admin only)
router.post("/tasks", authMiddleware, async (req, res) => {
  try {
    console.log("=== Creating Task ===");
    console.log("Request body:", req.body);
    console.log("User ID:", req.userId);
    console.log("User Role:", req.userRole);
    
    const { title, description, assignedTo, priority, dueDate } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: "Task title is required" });
    }
    
    if (!assignedTo) {
      return res.status(400).json({ message: "Please select a team member to assign the task" });
    }
    
    if (!dueDate) {
      return res.status(400).json({ message: "Due date is required" });
    }
    
    // Check if user has permission to assign tasks (admin or manager)
    if (req.userRole !== "admin" && req.userRole !== "manager") {
      return res.status(403).json({ message: "Only managers and admins can assign tasks" });
    }
    
    // Verify the assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({ message: "Assigned user not found" });
    }
    
    // Create the task with proper date conversion
    const taskData = {
      title,
      description: description || "",
      assignedTo,
      assignedBy: req.userId,
      priority: priority || "medium",
      dueDate: new Date(dueDate), // Convert string to Date object
      status: "pending"
    };
    
    console.log("Task data being saved:", taskData);
    
    const task = new Task(taskData);
    await task.save();
    
    console.log("Task saved successfully with ID:", task._id);
    
    // Populate assignedTo and assignedBy details
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email designation")
      .populate("assignedBy", "name email");
    
    res.status(201).json({ 
      message: "Task assigned successfully", 
      task: populatedTask 
    });
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ 
      message: err.message,
      stack: err.stack 
    });
  }
});
// GET ALL TASKS (Admin/Manager - view all tasks, Employee - view their tasks)
router.get("/tasks", authMiddleware, async (req, res) => {
  try {
    let tasks;
    
    if (req.userRole === "admin" || req.userRole === "manager") {
      // Admin/Manager can see all tasks
      tasks = await Task.find()
        .populate("assignedTo", "name email designation")
        .populate("assignedBy", "name email")
        .sort({ createdAt: -1 });
    } else {
      // Employee can only see their own tasks
      tasks = await Task.find({ assignedTo: req.userId })
        .populate("assignedTo", "name email designation")
        .populate("assignedBy", "name email")
        .sort({ createdAt: -1 });
    }
    
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET TASKS BY TEAM (Manager only - get tasks of their team members)
router.get("/tasks/team", authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== "manager") {
      return res.status(403).json({ message: "Only managers can access team tasks" });
    }
    
    // Get all employees under this manager
    const teamMembers = await User.find({ 
      role: "employee",
      teamLead: req.userId 
    }).select("_id");
    
    const memberIds = teamMembers.map(m => m._id);
    memberIds.push(req.userId); // Include manager's own tasks if any
    
    const tasks = await Task.find({ assignedTo: { $in: memberIds } })
      .populate("assignedTo", "name email designation")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE TASK STATUS (Employee can update their own task status)
// UPDATE TASK (Manager/Admin can update any task)
router.put("/tasks/:taskId", authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, dueDate, status, assignedTo } = req.body;
    
    if (req.userRole !== "admin" && req.userRole !== "manager") {
      return res.status(403).json({ message: "Only managers and admins can update tasks" });
    }
    
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = new Date(dueDate); // Convert to Date object
    if (status) task.status = status;
    if (assignedTo) task.assignedTo = assignedTo;
    task.updatedAt = new Date();
    
    await task.save();
    
    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email designation")
      .populate("assignedBy", "name email");
    
    res.json({ message: "Task updated successfully", task: updatedTask });
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ message: err.message });
  }
});

// UPDATE TASK (Manager/Admin can update any task)
// UPDATE TASK STATUS (Employee can update their own task status)
router.put("/tasks/:taskId/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "in-progress", "completed", "overdue"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    // Check if user is assigned to this task or is admin/manager
    if (task.assignedTo.toString() !== req.userId && req.userRole !== "admin" && req.userRole !== "manager") {
      return res.status(403).json({ message: "Unauthorized to update this task" });
    }
    
    task.status = status;
    if (status === "completed") {
      task.completedAt = new Date();
    }
    task.updatedAt = new Date();
    await task.save();
    
    // Populate and return updated task
    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email designation")
      .populate("assignedBy", "name email");
    
    res.json({ message: "Task status updated successfully", task: updatedTask });
  } catch (err) {
    console.error("Error updating task status:", err);
    res.status(500).json({ message: err.message });
  }
});
// DELETE TASK (Manager/Admin only)
router.delete("/tasks/:taskId", authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== "admin" && req.userRole !== "manager") {
      return res.status(403).json({ message: "Only managers and admins can delete tasks" });
    }
    
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    await Task.findByIdAndDelete(req.params.taskId);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD COMMENT TO TASK
router.post("/tasks/:taskId/comments", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }
    
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    task.comments.push({
      text,
      commentedBy: req.userId,
      commentedAt: new Date()
    });
    
    await task.save();
    
    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .populate("comments.commentedBy", "name email");
    
    res.json({ message: "Comment added successfully", task: updatedTask });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;