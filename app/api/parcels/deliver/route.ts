import { connectDB } from "@/lib/mongodb";
import Parcel from "@/models/Parcel";

export async function POST (req: Request) {
    try {
        await connectDB();

        const { trackingNumbers } = await req.json();

        const updatedParcels = await Parcel.updateMany(
            { trackingNumber: { $in: trackingNumbers } },
            {
                status: "DELIVERED",
                deliveryDate: new Date()
            }
        );

        return Response.json({
            message: "Parcels delivered",
            updatedParcels
        });

    } catch (error) {
        return Response.json({ error: "Delivery failed" }, { status: 500 });
    }
}