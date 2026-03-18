import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { stat } from "fs";

export async function POST(req: Request) {
    try {
        await connectDB();

        const { email, password } = await req.json();

        const user = await User.findOne({ email });
        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 });
        }

        return Response.json({ message: "Login successful", user });
    } catch (error) {
        return Response.json({ error: "Login failed" }, { status: 500 });
    }
}