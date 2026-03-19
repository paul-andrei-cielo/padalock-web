import mongoose from "mongoose";

const LockerSchema = new mongoose.Schema({
    code: String,
    status: String,
    failedPinAttempts: Number,
    lockout: Boolean
});

export default mongoose.models.Locker || mongoose.model("Locker", LockerSchema);