import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(req: Request) {
    try {
        await connectDB();

        const decoded: any = getUserFromRequest(req);

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
            decoded.userId,
            updateData,
            { new: true }
        );

        return Response.json({ message: "User updated", user: updatedUser });
    } catch (error) {
        return Response.json({ error: "Update failed" }, { status: 500 });
    }
}