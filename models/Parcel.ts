import mongoose from "mongoose";

const ParcelSchema = new mongoose.Schema({
    trackingNumber: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    parcelName: String,
    status: String,
    deliveryDate: Date,
    retrievedDate: Date,
    createdAt: Date
});

export default mongoose.models.Parcel || mongoose.model("Parcel", ParcelSchema);