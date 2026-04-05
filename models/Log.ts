import mongoose, { models, mongo } from "mongoose";

const LogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  lockerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Locker",
    required: true
  },
  actor: {
    type: String,
    enum: ['user', 'courier', 'system'],
    required: true
  },
  action: {
    type: String,
    enum: [
      'PIN_ENTERED', 'LID_OPENED', 'LID_CLOSED', 'LOCK_ENGAGED',
      'PARCEL_DETECTED', 'PIN_LOCKOUT', 'PIN_RESET', 'COURIER_ACCESS'
    ],
    required: true
  },
  success: {
    type: Boolean,
    required: true
  },
  details: String,
  cameraRecording: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.models.Log || mongoose.model("Log", LogSchema);