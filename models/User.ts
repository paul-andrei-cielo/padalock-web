import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    pin: String,
    lockerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Locker"
    }
});

export default mongoose.models.User || mongoose.model("User", UserSchema);