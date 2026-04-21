import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  gender: { type: String, required: true },

  role: {
    type: String,
    enum: ["admin", "hr", "employer", "manager", "employee"],
    required: true,
  },

  designation: {
    type: String,
    enum: ["team lead", "L1", "L2", "FE"],
    required: function () {
      return this.role === "employee";
    },
  },

  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () {
      return this.role === "employee" && this.designation !== "team lead";
    },
  },

  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpires: Date,
  
  // NEW FIELDS
  address: { type: String, default: "" },
  dateOfBirth: { type: Date, default: null },
  emergencyContact: {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    relationship: { type: String, default: "" }
  },
  bankDetails: {
    accountNumber: { type: String, default: "" },
    bankName: { type: String, default: "" },
    ifscCode: { type: String, default: "" }
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);