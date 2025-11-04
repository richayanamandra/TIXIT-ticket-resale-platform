import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { 
    type: String, 
    enum: ["Movie", "Concert", "Standup Comedy", "Restaurant", "Sports", "Art", "Festive/Religious", "Other"], 
    required: true 
  },
  city: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // could use string like "19:30"
  place: { type: String, required: true },
  details: { type: String }, // VIP, seating info, etc.
  price: { type: Number, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  isSold: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Ticket", ticketSchema);
