// account-backend.js
// Customer Account Routes for FaielyCreations

const express = require("express");
const router = express.Router();

const { requireLogin } = require("./auth-backend");
const User = require("./data-models/user");

/* ---------- ALL (CUSTOMER)ACCOUNT ROUTES ---------- */

// /api/account/get-profile
router.get("/get-profile", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    res.json({
      email: user.email,
      displayName: user.displayName || "",
      addresses: user.addresses || [],
      measurements: user.measurements || {},
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load account" });
  }
});

// /api/account/save-profile"
router.post("/save-profile", requireLogin, async (req, res) => {
  const { displayName } = req.body;

  try {
    await User.findByIdAndUpdate(req.session.userId, { displayName });
    res.json({ status: "saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// /api/account/add-address
router.post("/add-address", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    user.addresses.push(req.body);
    await user.save();

    res.json({ status: "added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add address" });
  }
});

// /api/account/update-address
router.post("/update-address", requireLogin, async (req, res) => {
  const { index, updated } = req.body;

  try {
    const user = await User.findById(req.session.userId);

    if (!user.addresses[index]) {
      return res.status(400).json({ error: "Address not found" });
    }

    user.addresses[index] = updated;
    await user.save();

    res.json({ status: "updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update address" });
  }
});

// /api/account/delete-address
router.post("/delete-address", requireLogin, async (req, res) => {
  const { index } = req.body;

  try {
    const user = await User.findById(req.session.userId);

    if (!user.addresses[index]) {
      return res.status(400).json({ error: "Address not found" });
    }

    user.addresses.splice(index, 1);
    await user.save();

    res.json({ status: "deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete address" });
  }
});

// /api/account/save-measurements
router.post("/save-measurements", requireLogin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.session.userId, {
      measurements: req.body
    });

    res.json({ status: "saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save measurements" });
  }
});

/* ---------- EXPORT ROUTER --------------- */
module.exports = { accountRouter: router };
