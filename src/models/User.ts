import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ["SUPER_ADMIN", "USER", "ADMIN"], 
    default: "USER" 
  },
  isApproved: { 
    type: Boolean, 
    default: false 
  },
  // Reset fields with index for faster lookup
  resetToken: { 
    type: String, 
    default: null,
    index: true 
  },
  resetTokenExpiry: { 
    type: Date, 
    default: null 
  },
}, { 
  timestamps: true 
});

// Clear reset token if expired (optional logic)
UserSchema.methods.isResetTokenValid = function(token: string) {
    return this.resetToken === token && this.resetTokenExpiry > new Date();
};

export default models.User || model("User", UserSchema);