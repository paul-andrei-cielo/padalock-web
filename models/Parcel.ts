import mongoose from "mongoose";

const ParcelSchema = new mongoose.Schema({
    trackingNumber: {
        type: String, 
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    parcelName: {
        type: String,
        default: "Parcel"
    },
    status: {
        type: String,
        enum: ["PENDING", "DELIVERED", "RETRIEVED"],
        default: "PENDING"
    },
    deliveryDate: Date,
    retrievedDate: Date,
    createdAt: Date
});

export default mongoose.models.Parcel || mongoose.model("Parcel", ParcelSchema);