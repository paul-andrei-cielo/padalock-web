import { connectDB } from "@/lib/mongodb";
import Parcel from "@/models/Parcel";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(req: Request) {
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

        return Response.json({
            message: "Parcels retrieved",
            updated
        });
    } catch (error) {
        return Response.json({ error: "Unauthorized", }, { status: 401} );
    }
}