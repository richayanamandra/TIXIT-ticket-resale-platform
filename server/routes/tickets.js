import express from "express";
import Ticket from "../models/Ticket.js";

const router = express.Router();

// POST /api/tickets - create a new ticket
router.post("/", async (req, res) => {
  try {
    console.log("🎟️ Incoming ticket data:", req.body);

    const ticket = new Ticket({
      ...req.body,
      price: Number(req.body.price), // ensure price is number
                 // attach logged-in user as seller
    });

    await ticket.save();
    console.log("✅ Ticket saved:", ticket);
    res.status(201).json(ticket);
  } catch (error) {
    console.error("❌ Error creating ticket:", error);
    res.status(500).json({
      message: "Error creating ticket",
      error: error.message,
      errors: error.errors
    });
  }
});

// GET /api/tickets - get all tickets
router.get("/", async (req, res) => {
  try {
    const tickets = await Ticket.find().populate("seller", "name email");
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tickets" });
  }
});

export default router;
