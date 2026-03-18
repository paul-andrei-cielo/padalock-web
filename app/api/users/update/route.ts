import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
    try {
        await connectDB();

        const { userId, name, password, pin } = await req.json();

        const updateData: any = {};

        if (name) updateData.name = name;

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (pin) {
            updateData.pin = await bcrypt.hash(pin, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        return Response.json({ message: "User updated", user: updatedUser });
    } catch (error) {
        return Response.json({ error: "Update failed" }, { status: 500 });
    }
}