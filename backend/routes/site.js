import express from "express";
import jwt from "jsonwebtoken";
import Site from "../models/Site.js";
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

// Helper: check if user is FE (can create only)
const isFE = async (userId) => {
  const user = await User.findById(userId);
  return user && user.role === "employee" && user.designation === "FE";
};

// Helper: check if user is Team Lead or L2 (can edit/delete)
const isTeamLeadOrL2 = async (userId) => {
  const user = await User.findById(userId);
  return user && user.role === "employee" && 
         (user.designation === "team lead" || user.designation === "L2");
};

// GET all sites (any authenticated user)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const sites = await Site.find()
      .populate("createdBy", "name email designation")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 });
    res.json(sites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single site
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id).populate("createdBy", "name");
    if (!site) return res.status(404).json({ message: "Site not found" });
    res.json(site);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create site – only FE
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (!(await isFE(req.userId))) {
      return res.status(403).json({ message: "Only FE can upload site data" });
    }
    const siteData = { ...req.body, createdBy: req.userId };
    const site = new Site(siteData);
    await site.save();
    res.status(201).json({ message: "Site data created successfully", site });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Exicom Device ID already exists" });
    res.status(500).json({ message: err.message });
  }
});

// PUT update site – only Team Lead or L2
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (!(await isTeamLeadOrL2(req.userId))) {
      return res.status(403).json({ message: "Only Team Lead or L2 can update site data" });
    }
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ message: "Site not found" });
    const updated = await Site.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.userId },
      { new: true }
    );
    res.json({ message: "Site data updated", site: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE site – only Team Lead or L2
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!(await isTeamLeadOrL2(req.userId))) {
      return res.status(403).json({ message: "Only Team Lead or L2 can delete site data" });
    }
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ message: "Site not found" });
    await site.deleteOne();
    res.json({ message: "Site data deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;