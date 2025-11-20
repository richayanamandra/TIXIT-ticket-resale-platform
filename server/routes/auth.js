import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import passport from "passport";
import { body, validationResult } from "express-validator";

const router = express.Router();

// JWT generator
const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/* =========================================================
   SIGNUP  (with sanitization + type safety)
   ========================================================= */
router.post(
  "/signup",
  [
    body("name").trim().escape(),
    body("email").trim().normalizeEmail(),
    body("password").trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const { name, email, password } = req.body || {};

      // 🔥 FIX: Prevent object/array injection for email
      if (typeof email !== "string") {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Basic validation
      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ message: "Name, email and password are required" });
      }

      const normalizedEmail = String(email).toLowerCase().trim();

      // Check existing user
      const userExists = await User.findOne({ email: normalizedEmail });
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user
      const user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        password,
      });

      const token = createToken(user);

      return res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error("Signup error:", err);
      return res.status(500).json({ message: "Unable to create account" });
    }
  }
);

/* =========================================================
   LOGIN  (with sanitization + type safety)
   ========================================================= */
router.post(
  "/login",
  [
    body("email").trim().normalizeEmail(),
    body("password").trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const { email, password } = req.body || {};

      // 🔥 FIX: Prevent object/array injection for email
      if (typeof email !== "string") {
        return res.status(400).json({ message: "Invalid email format" });
      }

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const normalizedEmail = String(email).toLowerCase().trim();

      const user = await User.findOne({ email: normalizedEmail });

      // Generic error to prevent user enumeration
      if (!user)
        return res.status(400).json({ message: "Invalid credentials" });

      const isMatch = await user.comparePassword(password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      const token = createToken(user);

      return res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Error logging in" });
    }
  }
);

/* =========================================================
   GOOGLE OAUTH (unchanged)
   ========================================================= */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect:
      (process.env.CLIENT_ROOT_URL || "http://localhost:3000") + "/login",
  }),
  (req, res) => {
    const token = createToken(req.user);
    const redirectTo =
      (process.env.CLIENT_ROOT_URL || "http://localhost:3000") +
      `/login?token=${token}`;
    res.redirect(redirectTo);
  }
);

/* =========================================================
   CHANGE PASSWORD (currentPassword → newPassword)
   ========================================================= */
router.post("/change-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Google OAuth Users have no password
    if (!user.password) {
      return res.status(400).json({
        message:
          "This account uses Google Login and has no password set.",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password too short" });
    }

    user.password = newPassword; // will hash automatically in pre-save hook
    await user.save();

    const newToken = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Password updated successfully",
      token: newToken,
    });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


export default router;
