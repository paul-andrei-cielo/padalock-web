import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Parcel from "@/models/Parcel";
import Locker from "@/models/Locker";
import Log from "@/models/Log";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        
        let { code, lockerCode, action, status } = body;
        if (!action && status) action = status; 
        if (!action && code) action = "VERIFY"; 

        if (action === "VERIFY") {
            const locker = await Locker.findOne({ code: lockerCode });
            if (!locker) return NextResponse.json({ error: "Locker not found" }, { status: 404 });

            if (locker.isLockedOut || !locker.pin) {
                return NextResponse.json({ mode: "LOCKED_OUT" });
            }

            const inputCode = String(code).trim();

            if (locker.pin === inputCode) {
                await Locker.updateOne({ _id: locker._id }, { failedAttempts: 0 });
                return NextResponse.json({ mode: "OWNER" });
            }

            const parcel = await Parcel.findOne({
                trackingNumber: inputCode,
                userId: new mongoose.Types.ObjectId(locker.userId.toString()),
                status: "PENDING"
            });

            if (parcel) {
                parcel.status = "VERIFIED";
                await parcel.save();
                await Locker.updateOne({ _id: locker._id }, { failedAttempts: 0 });
                return NextResponse.json({ mode: "DELIVERY" });
            }

            const existingParcelWrongStatus = await Parcel.findOne({
                trackingNumber: inputCode,
                userId: new mongoose.Types.ObjectId(locker.userId.toString())
            });

            if (existingParcelWrongStatus) {
                return NextResponse.json({ 
                    mode: "INVALID", 
                    details: "Parcel already processed or not pending" 
                });
            }

            const newAttempts = (locker.failedAttempts || 0) + 1;
            
            if (newAttempts >= 3) {
                await Locker.updateOne(
                    { _id: locker._id }, 
                    { pin: null, failedAttempts: newAttempts, isLockedOut: true }
                );
                await Log.create({
                    userId: locker.userId,
                    lockerId: locker._id,
                    actor: "system",
                    action: "PIN_LOCKOUT",
                    success: false,
                    details: "3 failed attempts reached."
                });
                return NextResponse.json({ mode: "LOCKED_OUT" });
            } else {
                await Locker.updateOne({ _id: locker._id }, { failedAttempts: newAttempts });
                return NextResponse.json({ 
                    mode: "INVALID", 
                    attemptsRemaining: 3 - newAttempts 
                });
            }
        }

        if (action === "DELIVERED" || action === "DELIVERY_VALID" || action === "PARCEL_DETECTED") {
            const locker = await Locker.findOne({ code: lockerCode });
            if (!locker) return NextResponse.json({ error: "Locker not found" }, { status: 404 });
            const verifiedParcels = await Parcel.find({ userId: locker.userId, status: "VERIFIED" });
            for (const parcel of verifiedParcels) {
                parcel.status = "DELIVERED";
                parcel.deliveryDate = new Date();
                await parcel.save();
                await Log.create({
                    userId: parcel.userId, lockerId: locker._id, actor: "courier",
                    action: "DELIVERY_SUCCESS", success: true, details: `Parcel ${parcel.trackingNumber} delivered`
                });
            }
            return NextResponse.json({ ok: true });
        }

        if (action === "RETRIEVE" || action === "PARCEL_REMOVED") {
            const locker = await Locker.findOne({ code: lockerCode });
            if (!locker) return NextResponse.json({ error: "Locker not found" }, { status: 404 });
            await Parcel.updateMany({ userId: locker.userId, status: "DELIVERED" }, { $set: { status: "RETRIEVED", retrievedDate: new Date() } });
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ mode: "INVALID" });

    } catch (err: any) {
        console.error("IOT_ERROR:", err.message);
        return NextResponse.json({ error: "server error" }, { status: 500 });
    }
}