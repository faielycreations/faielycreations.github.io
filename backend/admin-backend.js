// admin-backend.js
// Admin Account Routes for FaielyCreations

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const User = require("./data-models/user");
const { requireAdmin } = require("./auth-backend");

/* ---------- ALL ADMIN ROUTES ---------- */

function requireFields(fields, body) {
  for (const f of fields) {
    if (!body[f]) return `Missing field: ${f}`;
  }
  return null;
}

// /api/admin/
router.post("/create-admin", requireAdmin, async (req, res) => {
  try {
    const err = requireFields(["email", "password"], req.body);
    if (err) return res.status(400).json({ error: err });
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const bcrypt = require("bcrypt");
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = new User({
      email,
      passwordHash,
      role: "admin",
      emailVerified: true
    });

    await admin.save();
    res.json({ status: "admin_created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create admin" });
  }
});

// /api/admin/
router.get("/summary", requireAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments({ role: "customer" });

    res.json({ userCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load summary" });
  }
});

// /api/admin/
router.get("/get-users", requireAdmin, async (req, res) => {
  try {
    const customers = await User.sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

// /api/admin/
router.get("/system/health", requireAdmin, async (req, res) => {
  const state = mongoose.connection.readyState; // 1 = connected
  const status = state === 1 ? "connected" : "disconnected";

  const stats = await Order.aggregate([
    { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" } } }
  ]);

  res.json({
    mongoStatus: status,
    orderCount: stats[0]?.count || 0,
    totalRevenue: stats[0]?.total || 0
  });
});

module.exports = { adminRouter: router };
