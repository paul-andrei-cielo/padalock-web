import { connectDB } from "@/lib/mongodb";
import Parcel from "@/models/Parcel";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await connectDB();

        const user: any = getUserFromRequest(req);

        const parcels = await Parcel.find({ userId: user.userId });

        return Response.json(parcels);
    } catch (error) {
        return Response.json({ error: "Unauthorized" }, { status: 400 });
    }
}

export async function POST(req:Request) {
    try {
        await connectDB();

        const user: any = getUserFromRequest(req);
        const { trackingNumber, parcelName } = await req.json();

        const parcel = await Parcel.create({
            trackingNumber,
            parcelName: parcelName || "Parcel",
            userId: user.userId,
            status: "PENDING"
        });

        return Response.json(parcel);
    } catch (error) {
        return Response.json({ error: "Failed to create parcel"}, { status: 500 });
    }
}