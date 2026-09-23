import { connectDB } from "@/lib/mongodb";
import Parcel from "@/models/Parcel";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import Locker from "@/models/Locker";

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);

        const parcels = await Parcel.find({
            userId: user.userId
        }).lean();

        return NextResponse.json(parcels);

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

        if (!user) {
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

        const { trackingNumber, parcelName } = await req.json();

        const parcel = await Parcel.create({
            trackingNumber,
            parcelName: parcelName || "Parcel",
            userId: user.userId,
            status: "PENDING",
            deliveryDate: null,
            retrievedDate: null
        });

        return NextResponse.json(parcel);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create parcel"}, { status: 500 });
    }
}