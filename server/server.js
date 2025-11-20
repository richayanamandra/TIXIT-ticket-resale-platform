import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import cors from "cors";

import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import authRoutes from "./routes/auth.js";
import ticketRoutes from "./routes/tickets.js";
import User from "./models/User.js";

dotenv.config();
const app = express();

/* ---------------------------------------------------
   SECURITY HEADERS (FIXED)
--------------------------------------------------- */

// Helmet core settings → disable CORP (prevents 403 on GET)
app.use(
  helmet({
    crossOriginResourcePolicy: false, // 🔥 FIXES your 403 error
  })
);

// CSP (safe + supports Google OAuth + React dev)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://ssl.gstatic.com",
        "'unsafe-inline'" // needed for React DevTools & hot reload
      ],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "http://localhost:3000",
        "https://accounts.google.com"
      ],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      scriptSrcAttr: ["'none'"],
    },
  })
);


/* ---------------------------------------------------
   BODY PARSERS
--------------------------------------------------- */
app.use(cookieParser());
app.use(express.json());

/* ---------------------------------------------------
   SAFE NoSQL Sanitizer
--------------------------------------------------- */
const sanitizeRequest = (req, _res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const key in obj) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
        continue;
      }
      const val = obj[key];
      if (typeof val === "object") sanitize(val);
    }
  };

  sanitize(req.body);
  sanitize(req.params);
  // DO NOT touch req.query — Express 5 protects it
  next();
};

app.use(sanitizeRequest);


/* ---------------------------------------------------
   CORS (Correct, Safe)
--------------------------------------------------- */
app.use(
  cors({
    origin: process.env.CLIENT_ROOT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  })
);

/* ---------------------------------------------------
   RATE LIMIT AUTH ENDPOINTS
--------------------------------------------------- */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});
app.use("/api/auth", authLimiter);

/* ---------------------------------------------------
   SESSION & PASSPORT (Google OAuth)
--------------------------------------------------- */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "tixit-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});

/* ---------------------------------------------------
   GOOGLE OAUTH STRATEGY
--------------------------------------------------- */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        (process.env.SERVER_ROOT_URL || "http://localhost:5000") +
        "/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const googleId = profile.id;
        const name = profile.displayName || "Google User";

        if (!email) return done(new Error("Google account has no email"), null);

        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (!user) {
          user = await User.create({ name, email, googleId });
        } else if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

/* ---------------------------------------------------
   HEALTH CHECK
--------------------------------------------------- */
app.get("/", (_req, res) => res.send("🎟️ TixIt backend is running!"));


/* ---------------------------------------------------
   MONGO CONNECT
--------------------------------------------------- */
mongoose.set("strictQuery", true);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

/* ---------------------------------------------------
   RATE LIMIT TICKET ENDPOINTS
--------------------------------------------------- */
const createTicketLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // max 5 ticket creations per 10 min per IP
  message: { message: "Too many tickets created. Please slow down." },
});

const readTicketsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // max 60 reads/min (1 per second)
  message: { message: "Too many requests. Please wait a moment." },
});

// Apply to specific routes
app.use("/api/tickets", (req, res, next) => {
  if (req.method === "POST") return createTicketLimiter(req, res, next);
  if (req.method === "GET") return readTicketsLimiter(req, res, next);
  next();
});


/* ---------------------------------------------------
   ROUTES
--------------------------------------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

/* ---------------------------------------------------
   START SERVER
--------------------------------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
