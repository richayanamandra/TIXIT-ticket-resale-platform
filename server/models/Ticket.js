import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  category: { type: String, required: true },
  city: { type: String, required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  time: { type: String, required: true }, // "HH:mm"
  place: { type: String, required: true },
  details: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
  isSold: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Ticket", ticketSchema);
