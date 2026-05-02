import express from "express";
import jwt from "jsonwebtoken";
import Leave from "../models/Leave.js";
import User from "../models/User.js";

const router = express.Router();

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Access denied" });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.id;
    req.userRole = verified.role;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// POST /api/leave – employee request leave
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    const leave = await Leave.create({
      employee: req.userId,
      startDate,
      endDate,
      reason,
      status: "pending",
    });
    res.status(201).json({ message: "Leave request submitted", leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/leave – fetch leave requests based on role
router.get("/", authMiddleware, async (req, res) => {
  try {
    let filter = {};
    const { status, employeeId } = req.query;

    if (req.userRole === "admin" || req.userRole === "hr") {
      // Admin/HR see all, optionally filter by employee
      if (employeeId) filter.employee = employeeId;
    } else if (req.userRole === "manager") {
  // 1. Team leads directly under the manager
  const teamLeads = await User.find({
    role: "employee",
    designation: "team lead",
    teamLead: req.userId
  }).select("_id");
  const teamLeadIds = teamLeads.map(lead => lead._id);

  // 2. Regular employees who report to those team leads
  const regularEmployees = await User.find({
    role: "employee",
    designation: { $in: ["L1", "L2", "FE"] },
    teamLead: { $in: teamLeadIds }
  }).select("_id");

  // 3. Also direct reports (employees whose teamLead is the manager)
  const directReports = await User.find({
    role: "employee",
    teamLead: req.userId
  }).select("_id");

  // Combine all relevant employee IDs
  const memberIds = [
    ...teamLeadIds,
    ...regularEmployees.map(emp => emp._id),
    ...directReports.map(emp => emp._id),
    req.userId // manager's own leave requests
  ];

  filter.employee = { $in: memberIds };
} else {
      // Employee sees only their own
      filter.employee = req.userId;
    }

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const leaves = await Leave.find(filter)
      .populate("employee", "name email designation")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/leave/:id – approve/reject (HR/Manager/Admin)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const leave = await Leave.findById(req.params.id).populate("employee");
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    // Check permissions
    const isAdmin = req.userRole === "admin";
    const isHr = req.userRole === "hr";
    let isManagerForEmployee = false;
    if (req.userRole === "manager") {
      const employee = await User.findById(leave.employee._id);
      // Check if this manager is the teamLead or the team lead's manager? 
      // Simplified: manager can approve if employee's teamLead chain includes manager
      const teamLead = await User.findById(employee.teamLead);
      if (teamLead && (teamLead._id.toString() === req.userId || teamLead.teamLead?.toString() === req.userId)) {
        isManagerForEmployee = true;
      } else if (employee.designation === "team lead" && employee.teamLead?.toString() === req.userId) {
        isManagerForEmployee = true;
      }
    }

    if (!isAdmin && !isHr && !isManagerForEmployee) {
      return res.status(403).json({ message: "You are not authorized to review this request" });
    }

    leave.status = status;
    leave.remarks = remarks || "";
    leave.reviewedBy = req.userId;
    leave.reviewedAt = new Date();
    await leave.save();

    res.json({ message: `Leave request ${status}`, leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Debug route – remove after testing
router.get("/debug-team/:managerId", authMiddleware, async (req, res) => {
  const managerId = req.params.managerId;
  const employees = await User.find({ role: "employee" }).select("name designation teamLead");
  const teamLeadsUnderManager = await User.find({ role: "employee", designation: "team lead", teamLead: managerId });
  const regularEmployeesUnderLeads = await User.find({ role: "employee", designation: { $in: ["L1","L2","FE"] }, teamLead: { $in: teamLeadsUnderManager.map(l => l._id) } });
  res.json({
    managerId,
    allEmployees: employees,
    teamLeadsUnderManager,
    regularEmployeesUnderLeads
  });
});

export default router;