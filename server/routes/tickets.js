import express from "express";
import Ticket from "../models/Ticket.js";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

const router = express.Router();

// Extract seller from JWT
const getUserIdFromAuth = (req) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
};

// NoSQL detector inside strings
const containsNoSQLOperator = (str) => {
  if (typeof str !== "string") return false;
  return /\$(gt|gte|lt|lte|ne|in|nin|or|regex)\s*:/i.test(str);
};

// JOI validation schema
const ticketSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(2000).allow(""),
  category: Joi.string().required(),
  city: Joi.string().required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  place: Joi.string().required(),
  details: Joi.string().max(2000).allow(""),
  price: Joi.alternatives(
    Joi.number().min(0),
    Joi.string().pattern(/^\d+(\.\d+)?$/)
  ).required(),
}).options({ stripUnknown: true });

// ---------------------------
// POST: Create Ticket
// ---------------------------
router.post(
  "/",
  [
    body("title").trim().escape(),
    body("category").trim().escape(),
    body("city").trim().escape(),
    body("place").trim().escape(),
  ],
  async (req, res) => {
    // express-validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Invalid input" });
    }

    // Joi validate
    const { error, value } = ticketSchema.validate(req.body, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        details: error.details,
      });
    }

    // Detect NoSQL injection
    for (const [key, val] of Object.entries(value)) {
      if (typeof val === "string" && containsNoSQLOperator(val)) {
        return res.status(400).json({
          message: `NoSQL injection detected in "${key}" field`,
        });
      }
    }

    // XSS sanitize
    const clean = {
      ...value,
      description: sanitizeHtml(value.description || "", {
        allowedTags: [],
        allowedAttributes: {},
      }),
      details: sanitizeHtml(value.details || "", {
        allowedTags: [],
        allowedAttributes: {},
      }),
      price: Number(value.price),
    };

    // Attach logged in user
    const sellerId = getUserIdFromAuth(req);
    if (sellerId) clean.seller = sellerId;

    try {
      const ticket = new Ticket(clean);
      await ticket.save();
      res.status(201).json(ticket);
    } catch (err) {
      console.error("Error creating ticket:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// ---------------------------
// GET: All tickets
// ---------------------------
router.get("/", async (_req, res) => {
  try {
    const tickets = await Ticket.find().populate("seller", "name email");
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tickets" });
  }
});

export default router;
