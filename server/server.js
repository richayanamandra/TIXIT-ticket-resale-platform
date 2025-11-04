import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import ticketRoutes from "./routes/tickets.js";


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🎟️ TixIt backend is running!");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
