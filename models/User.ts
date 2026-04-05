import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    pin: String,
    lockerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Locker"
    }
}, {
    timestamps: true
});

export default mongoose.models.User || mongoose.model("User", UserSchema);