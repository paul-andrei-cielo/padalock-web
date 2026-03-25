import { connectDB } from "@/lib/mongodb";
import Parcel from "@/models/Parcel";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
    try {
        await connectDB();

        const user: any = getUserFromRequest(req);

        const updated = await Parcel.updateMany(
            {
                userId: user.userId,
                status: "DELIVERED"
            },
            {
                status: "RETRIEVED",
                retrievedDate: new Date()
            }
        );

        return NextResponse.json({
            message: "Parcels retrieved",
            updated
        });
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized", }, { status: 401} );
    }
}