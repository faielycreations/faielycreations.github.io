// server.js
// Main backend entry point for FaielyCreations Store

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo").default;
const path = require("path");

const app = express();

/* ---------------------------
   1. MongoDB Connection
---------------------------- */
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

/* ---------------------------
   2. CORS (Frontend Domain)
---------------------------- */
app.use(cors({
  origin: process.env.FRONTEND_URL,   // e.g. https://faielycreations.github.io
  credentials: true
}));

/* ---------------------------
   3. Body Parsing
---------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------------------
   4. Sessions (Production)
---------------------------- */
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 60 * 60 * 24 * 7 // 7 days
  }),
  cookie: {
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));


/* ---------------------------
   5. Static Uploads
---------------------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------------------------
   6. API Routes
---------------------------- */
app.use("/api/auth", require("./auth-backend").authRouter);
app.use("/api/account", require("./account-backend").accountRouter);
app.use("/api/admin", require("./admin-backend").adminRouter);

app.get("/api/config", (req, res) => {
  res.json({
    api: process.env.BACKEND_URL
  });
});

/* ---------------------------
   7. Start Server
---------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
