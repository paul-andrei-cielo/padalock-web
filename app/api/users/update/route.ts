import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
    try {
        await connectDB();

        const decoded: any = getUserFromRequest(req);

        const { firstName, lastName, password, pin } = await req.json();

        const updateData: any = {};

        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (pin) {
            updateData.pin = await bcrypt.hash(pin, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            decoded.userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { password: _, ...userResponse } = updatedUser.toObject();

        return NextResponse.json({ message: "User updated", user: userResponse });
    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}