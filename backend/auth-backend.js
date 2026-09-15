// auth-backend.js
// Account authentication routes for FaielyCreations

const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const crypto = require("crypto");

const User = require("./data-models/user");

/* ---------- ALL AUTH ROUTES ---------- */
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Login required" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  User.findById(req.session.userId).then(user => {
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }
    req.user = user;
    next();
  }).catch(() => res.status(500).json({ error: "Server error" }));
}

// /api/auth/check
router.get("/check", (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ loggedIn: true });
  }
  res.json({ loggedIn: false });
});

// /api/auth/create
router.post("/create", async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password) {
    return res.json({ success: false, error: "Email and password required." });
  }

  const existing = await Users.findOne({ email });
  if (existing) {
    return res.json({ success: false, error: "Email already registered." });
  }

  const hashed = await bcrypt.hash(password, 10);

  await Users.create({
    email,
    password: hashed,
    displayName,
    createdAt: new Date()
  });

  res.json({ success: true });
});

// /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await Users.findOne({ email });
  if (!user) return res.json({ success: false, error: "Invalid credentials." });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.json({ success: false, error: "Invalid credentials." });

  req.session.userId = user._id;
  res.json({ success: true });
});

// /api/auth/forgot
router.post("/forgot", async (req, res) => {
  const { email } = req.body;
  const user = await Users.findOne({ email });
  if (!user) return res.json({ message: "If that email exists, a reset link has been sent." });

  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = token;
  user.resetTokenExpires = Date.now() + 1000 * 60 * 30; // 30 min
  await user.save();

  // send email with link: /account.html?resetToken=TOKEN
  res.json({ message: "Reset link sent." });
});

// /api/auth/reset
router.post("/reset", async (req, res) => {
  const { token, password } = req.body;
  const user = await Users.findOne({
    resetToken: token,
    resetTokenExpires: { $gt: Date.now() }
  });
  if (!user) return res.json({ message: "Invalid or expired token." });

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  res.json({ message: "Password reset." });
});

// /api/auth/verify
router.post("/verify", async (req, res) => {
  const { email } = req.body;
  const user = await Users.findOne({ email });
  if (!user) return res.json({ message: "If that email exists, a verification email has been sent." });

  const token = crypto.randomBytes(32).toString("hex");
  user.verifyToken = token;
  await user.save();

  // send email with link: /verify?token=TOKEN
  res.json({ message: "Verification email sent." });
});

// /api/auth/
router.post("/delete-account", requireLogin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.session.userId);
    await Order.deleteMany({ customerEmail: req.session.email });

    req.session.destroy(() => {
      res.json({ status: "deleted" });
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// /api/auth/
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ status: "logged_out" });
  });
});

// /api/auth/
router.get("/sessions", requireLogin, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.json(user.sessions);
});

// /api/auth/
router.post("/sessions/revoke", requireLogin, async (req, res) => {
  const { sessionId } = req.body;

  await User.findByIdAndUpdate(req.session.userId, {
    $pull: { sessions: { sessionId } }
  });

  res.json({ status: "revoked" });
});

// /api/auth/
router.get("/2fa/setup", requireLogin, async (req, res) => {
  const secret = speakeasy.generateSecret({ name: "FaielyCreations" });

  const user = await User.findById(req.session.userId);
  user.twoFactorSecret = secret.base32;
  await user.save();

  const qr = await qrcode.toDataURL(secret.otpauth_url);

  res.json({ qr });
});

// /api/auth/
router.post("/2fa/verify", requireLogin, async (req, res) => {
  const { token } = req.body;

  const user = await User.findById(req.session.userId);

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token
  });

  if (!verified) return res.status(400).json({ error: "Invalid code" });

  user.twoFactorEnabled = true;
  await user.save();

  res.json({ status: "2fa_enabled" });
});

// /api/auth/
router.post("/2fa/login", async (req, res) => {
  const { token } = req.body;

  const user = await User.findById(req.session.tempUserId);

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token
  });

  if (!verified) return res.status(400).json({ error: "Invalid code" });

  req.session.userId = user._id;
  req.session.role = user.role;
  req.session.email = user.email;

  req.session.tempUserId = null;

  res.json({ status: "logged_in" });
});

module.exports = { requireLogin, requireAdmin, authRouter : router };
