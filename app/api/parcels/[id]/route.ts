import { getUserFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Parcel from "@/models/Parcel";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        
        const { id } = await params;
        
        await connectDB();
        const user = getUserFromRequest(req);
        
        if (!user?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parcel = await Parcel.findOneAndDelete({
            _id: id,
            userId: user.userId
        });

        if (!parcel) {
            return NextResponse.json({ 
                error: "Parcel not found or doesn't belong to you" 
            }, { status: 404 });
        }

        return NextResponse.json({ message: "Parcel deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ 
            error: "Failed to delete: " + error.message 
        }, { status: 500 });
    }
}