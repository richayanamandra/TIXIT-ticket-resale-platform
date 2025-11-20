import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // made optional to support OAuth users
  googleId: { type: String }, // store googleId when user signs in with Google
}, { timestamps: true });

// Hash password before saving (only if password exists and is modified)
userSchema.pre("save", async function(next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password - handle case where no password exists
userSchema.methods.comparePassword = async function(password) {
  if (!this.password) return false; // no local password
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
