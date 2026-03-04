import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["SUPER_ADMIN", "USER"], default: "USER" },
  isApproved: { type: Boolean, default: false }, // Super Admin must set this to true
}, { timestamps: true });

export default models.User || model("User", UserSchema);