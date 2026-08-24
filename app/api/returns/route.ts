import { connectDB } from "@/lib/mongodb";
import Return from "@/models/Return";
import Locker from "@/models/Locker";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";


export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);

        if (!user?.userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const returns = await Return.find({
            userId: user.userId
        })
        .sort({ createdAt: -1 })
        .lean();

        return NextResponse.json(returns);

    } catch (error) {
        console.error("Fetch returns error:", error);

        return NextResponse.json(
            { error: "Failed to fetch returns" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);

        if (!user?.userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const locker = await Locker.findOne({
            userId: user.userId
        });

        if (!locker) {
            return NextResponse.json(
                { error: "No locker assigned to your account" },
                { status: 400 }
            );
        }

        const { parcelCount, items } = await req.json();

        if (
            !Number.isInteger(parcelCount) ||
            parcelCount < 1 ||
            !Array.isArray(items) ||
            items.length !== parcelCount ||
            items.some(
                (item) =>
                    typeof item !== "string" ||
                    !item.trim()
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "Parcel count must match the number of item descriptions"
                },
                { status: 400 }
            );
        }

        const returnDoc = await Return.create({
            userId: user.userId,
            lockerId: locker._id,
            parcelCount,
            items: items.map(
                (item: string) => item.trim()
            ),
            status: "PENDING"
        });

        return NextResponse.json(returnDoc);

    } catch (error) {
        console.error("Create return error:", error);

        return NextResponse.json(
            { error: "Failed to create return" },
            { status: 500 }
        );
    }
}