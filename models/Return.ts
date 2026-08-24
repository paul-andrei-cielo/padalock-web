import mongoose from "mongoose";

const ReturnSchema = new mongoose.Schema({
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
    itemDescription: {
        type: String,
        default: "Parcel"
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: [
        "PENDING",
        "READY_FOR_PICKUP",
        "OTP_ACTIVE",
        "PICKUP_ACTIVE",
        "PICKED_UP",
        "EXPIRED",
        "CANCELLED"
    ],
        default: "PENDING"
    },
    pickedUpDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

export default mongoose.models.Return || mongoose.model("Return", ReturnSchema);