import mongoose from "mongoose";

const siteSchema = new mongoose.Schema({
  state: { type: String, required: true },
  district: { type: String, required: true },
  block: { type: String, required: true },
  gp: { type: String, required: true },               // Gram Panchayat
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  mgmtIpAddress: { type: String, required: true },    // MGMT IP Address
  exicomDeviceId: { type: String, required: true, unique: true },
  blockCode: { type: String, required: true },
  solarType: { type: String, enum: ["enable", "not enable"], required: true },
  ebType: { type: String, enum: ["permanent", "temporary"], required: true },
  rackType: { type: String, enum: ["block", "gp"], required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("Site", siteSchema);