import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {

        await connectDB();

        const { name, email, password, pin } = await req.json();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return Response.json({ error: "User already exists"}, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPin = await bcrypt.hash(pin, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            pin: hashedPin
        });

        return Response.json({ message: "User registered", user: newUser });

    } catch (error) {
        return Response.json({ error: "Registration failed" }, { status: 500 });
    }
}