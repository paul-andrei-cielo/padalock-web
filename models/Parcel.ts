import mongoose from "mongoose";

export const PLATFORMS = ["Shopee", "TikTok Shop", "Other"] as const;

const DimensionsSchema = new mongoose.Schema(
    {
        length: { type: Number, required: true, min: 0.1 },
        width: { type: Number, required: true, min: 0.1 },
        height: { type: Number, required: true, min: 0.1 }
    },
    { _id: false }
);

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
        enum: [
            "PENDING",
            "VERIFIED",
            "DELIVERED",
            "RETRIEVED"
        ],
        default: "PENDING"
    },
    deliveryDate: {
        type: Date,
        default: null
    },
    retrievedDate: {
        type: Date,
        default: null
    },
    videoUrl: {
        type: String,
        default: null
    },
    source: {
        type: String,
        enum: PLATFORMS,
        default: "Other"
    },
    sourceOther: {
        type: String,
        default: "",
        maxlength: 40
    },
    description: {
        type: String,
        default: "",
        maxlength: 200
    },
    dimensions: {
        type: DimensionsSchema,
        default: null
    },
    image: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

export default mongoose.models.Parcel || mongoose.model("Parcel", ParcelSchema);