import mongoose, { models } from "mongoose";  

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
        'PIN_VALID',
        'INVALID_CODE',
        'PIN_LOCKOUT',
        'PIN_RESET',
        'LOCK_OPEN',
        'LOCK_CLOSED',
        'DELIVERY_VALID',
        'DELIVERY_SUCCESS',
        'RETRIEVE',
        'RETURN_OTP_VALID',
        'RETURN_OTP_INVALID',
        'RETURN_DEPOSITED',
        'RETURN_PICKUP_SUCCESS',
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