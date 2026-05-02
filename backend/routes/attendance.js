import express from "express";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Auth middleware (same as in auth.js)
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

// GET all employees (for HR dropdown / list)
router.get("/employees", authMiddleware, async (req, res) => {
  try {
    // Only HR or Admin can fetch employee list for attendance marking
    if (req.userRole !== "hr" && req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const employees = await User.find({ role: "employee" })
      .select("_id name email designation");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET attendance for a specific date (or range)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { date, employeeId, startDate, endDate } = req.query;
    let filter = {};

    // Only HR/Admin can see all; employee can only see own
    if (req.userRole !== "hr" && req.userRole !== "admin") {
      filter.employee = req.userId;
    } else if (employeeId) {
      filter.employee = employeeId;
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      // default: today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filter.date = { $gte: today, $lt: tomorrow };
    }

    const records = await Attendance.find(filter).populate("employee", "name email designation");
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST – mark or update attendance for an employee on a given date
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, remarks } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({ message: "Employee ID and date are required" });
    }

    // Only HR or Admin can mark attendance
    if (req.userRole !== "hr" && req.userRole !== "admin") {
      return res.status(403).json({ message: "Only HR/Admin can mark attendance" });
    }

    // Verify employee exists and is actually an employee
    const employee = await User.findOne({ _id: employeeId, role: "employee" });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Use upsert to create or update
    const attendance = await Attendance.findOneAndUpdate(
      { employee: employeeId, date: targetDate },
      {
        status: status || "absent",
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        remarks: remarks || "",
        markedBy: req.userId,
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: "Attendance saved", attendance });
  } catch (err) {
    // Handle duplicate key error (should not happen due to upsert)
    if (err.code === 11000) {
      return res.status(400).json({ message: "Attendance record already exists for this employee on this date" });
    }
    res.status(500).json({ message: err.message });
  }
});

// DELETE attendance record (HR/Admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== "hr" && req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: "Attendance record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// BULK POST – mark/update attendance for multiple employees in one request
router.post("/bulk", authMiddleware, async (req, res) => {
  try {
    const { date, records } = req.body;

    // Validation
    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "Date and non-empty records array are required" });
    }

    // Only HR/Admin allowed
    if (req.userRole !== "hr" && req.userRole !== "admin") {
      return res.status(403).json({ message: "Only HR/Admin can mark attendance in bulk" });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Validate each record and collect operations
    const bulkOps = [];
    const errors = [];

    for (const [index, record] of records.entries()) {
      const { employeeId, status, checkIn, checkOut, remarks } = record;

      // Check employee exists and has role 'employee'
      const employee = await User.findOne({ _id: employeeId, role: "employee" });
      if (!employee) {
        errors.push({ index, employeeId, error: "Employee not found or not an employee" });
        continue;
      }

      // Prepare update object
      const update = {
        status: status || "absent",
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        remarks: remarks || "",
        markedBy: req.userId,
      };

      bulkOps.push({
        updateOne: {
          filter: { employee: employeeId, date: targetDate },
          update: { $set: update },
          upsert: true,
        },
      });
    }

    if (bulkOps.length === 0) {
      return res.status(400).json({ message: "No valid employees to update", errors });
    }

    // Execute bulk write
    const result = await Attendance.bulkWrite(bulkOps, { ordered: false }); // continue even if some fail

    res.json({
      message: "Bulk attendance update completed",
      totalAttempted: records.length,
      succeeded: result.modifiedCount + result.upsertedCount,
      failed: errors.length + (result.writeErrors?.length || 0),
      details: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
        writeErrors: result.writeErrors,
      },
      validationErrors: errors,
    });
  } catch (err) {
    console.error("Bulk attendance error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;