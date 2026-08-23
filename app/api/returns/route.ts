import { connectDB } from "@/lib/mongodb";
import Return from "@/models/Return";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);

        const returns = await Return.find({
            userId: user.userId
        }).lean();

        return NextResponse.json(returns);

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 400 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);

        if (!user.lockerId) {
            return NextResponse.json(
                { error: "No locker assigned to your account" },
                { status: 400 }
            );
        }

        const { itemDescription } = await req.json();

        const returnDoc = await Return.create({
            userId: user.userId,
            lockerId: user.lockerId,
            itemDescription: itemDescription || "Parcel",
            status: "PENDING"
        });

        return NextResponse.json(returnDoc);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create return" }, { status: 500 });
    }
}