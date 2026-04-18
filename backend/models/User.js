import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  gender: { type: String, required: true },

  role: {
    type: String,
    enum: ["admin", "hr", "employer", "manager", "employee"], // ✅ added manager + employee
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
});

export default mongoose.model("User", userSchema);