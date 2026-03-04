import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }, // e.g., "RATION_KIT"
  count: { type: Number, required: true, default: 0 },
  lastUpdatedBy: { type: String }
}, { timestamps: true });

export default mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);