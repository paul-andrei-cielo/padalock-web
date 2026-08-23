import { getUserFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Return from "@/models/Return";
import { NextRequest, NextResponse } from "next/server";

const OTP_VALID_MINUTES = 1440;

function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        await connectDB();
        const user = getUserFromRequest(req);

        if (!user?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const returnDoc = await Return.findOneAndDelete({
            _id: id,
            userId: user.userId
        });

        if (!returnDoc) {
            return NextResponse.json({
                error: "Return not found or doesn't belong to you"
            }, { status: 404 });
        }

        return NextResponse.json({ message: "Return deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({
            error: "Failed to delete: " + error.message
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        await connectDB();
        const user = getUserFromRequest(req);

        if (!user?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { itemDescription } = body;

        const updatedReturn = await Return.findOneAndUpdate(
            { _id: id, userId: user.userId, status: "PENDING" },
            { itemDescription: itemDescription?.trim() || "Parcel" },
            { new: true, runValidators: true }
        );

        if (!updatedReturn) {
            return NextResponse.json({
                error: "Return not found, doesn't belong to you, or is no longer editable"
            }, { status: 404 });
        }

        return NextResponse.json({
            message: "Return updated successfully",
            return: updatedReturn
        });
    } catch (error: any) {
        console.error("Update return error:", error);
        return NextResponse.json({
            error: "Failed to update return: " + error.message
        }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { action } = await req.json();

        await connectDB();
        const user = getUserFromRequest(req);

        if (!user?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const returnDoc = await Return.findOne({ _id: id, userId: user.userId });

        if (!returnDoc) {
            return NextResponse.json({
                error: "Return not found or doesn't belong to you"
            }, { status: 404 });
        }

        if (action === "generate_otp") {
            if (returnDoc.status === "PICKED_UP") {
                return NextResponse.json({
                    error: "This return has already been picked up"
                }, { status: 400 });
            }

            returnDoc.otp = generateOtp();
            returnDoc.otpExpiry = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);
            returnDoc.status = "OTP_ACTIVE";
            await returnDoc.save();

            return NextResponse.json({
                message: "OTP generated",
                otp: returnDoc.otp,
                otpExpiry: returnDoc.otpExpiry
            });
        }

        if (action === "cancel") {
            returnDoc.status = "CANCELLED";
            await returnDoc.save();

            return NextResponse.json({ message: "Return cancelled", return: returnDoc });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Patch return error:", error);
        return NextResponse.json({
            error: "Failed to update return: " + error.message
        }, { status: 500 });
    }
}