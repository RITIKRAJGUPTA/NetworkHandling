import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const MANAGER_ID = "69e364b85a9d68e8772ad61f"; // 🔁 Replace with your actual manager ID

const fixHierarchy = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  // 1. Set all team leads to report to the manager
  const teamLeads = await User.updateMany(
    { role: "employee", designation: "team lead" },
    { $set: { teamLead: MANAGER_ID } }
  );
  console.log(`Updated ${teamLeads.modifiedCount} team leads to report to manager`);

  // 2. Get all team lead IDs (after update)
  const leadDocs = await User.find({ role: "employee", designation: "team lead" }).select("_id");
  const leadIds = leadDocs.map(l => l._id);

  // 3. Assign regular employees without a teamLead to a random team lead
  const regularEmployees = await User.find({
    role: "employee",
    designation: { $in: ["L1", "L2", "FE"] },
    $or: [{ teamLead: null }, { teamLead: { $exists: false } }]
  });

  for (let i = 0; i < regularEmployees.length; i++) {
    const leadId = leadIds[i % leadIds.length]; // round‑robin distribution
    await User.updateOne(
      { _id: regularEmployees[i]._id },
      { $set: { teamLead: leadId } }
    );
  }
  console.log(`Assigned team leads to ${regularEmployees.length} regular employees`);

  console.log("Hierarchy fixed permanently");
  process.exit();
};

fixHierarchy();