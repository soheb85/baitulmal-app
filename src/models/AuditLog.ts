import mongoose, { Schema, model, models } from "mongoose";

const AuditLogSchema = new Schema({
  action: { type: String, required: true }, 
  performedBy: { type: String, required: true }, 
  beneficiaryName: { type: String },
  details: { type: String }, 
  // TTL Index: This automatically deletes the record 10 days after the timestamp
  timestamp: { 
    type: Date, 
    default: Date.now, 
    expires: '10d' 
  },
});

export default models.AuditLog || model("AuditLog", AuditLogSchema);