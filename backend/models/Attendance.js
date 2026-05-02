import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0),
  },
  status: {
    type: String,
    enum: ["present", "absent", "half-day", "leave"],
    required: true,
    default: "absent",
  },
  checkIn: {
    type: String, // HH:MM format
    default: null,
  },
  checkOut: {
    type: String,
    default: null,
  },
  remarks: {
    type: String,
    default: "",
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

// Compound unique index: one record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;