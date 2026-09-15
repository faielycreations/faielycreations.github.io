// user.js
// User model for FaielyCreations
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, default: "customer" },

  displayName: { type: String, default: "" },

  addresses: [
    {
      label: String,       // "Home", "Work"
      name: String,
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String
    }
  ],

  measurements: {
    bust: Number,
    waist: Number,
    hip: Number,
    torso: Number
  },

  resetToken: String,
  resetTokenExpiry: Date,

  emailVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpiry: Date,

  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,

  sessions: [
    {
      sessionId: String,
      userAgent: String,
      createdAt: Date
    }
  ],


  createdAt: { type: Date, default: Date.now }
});



module.exports = mongoose.model("User", UserSchema);