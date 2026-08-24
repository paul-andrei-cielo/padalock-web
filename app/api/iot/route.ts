import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Parcel from "@/models/Parcel";
import Locker from "@/models/Locker";
import Log from "@/models/Log";
import Return from "@/models/Return";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        
        let { code, lockerCode, action, status, verifyType } = body;
        if (!action && status) action = status; 
        if (!action && code) action = "VERIFY"; 

       if (action === "VERIFY") {
    const locker = await Locker.findOne({ code: lockerCode });

    if (!locker) {
        return NextResponse.json(
            { error: "Locker not found" },
            { status: 404 }
        );
    }

    const inputCode = String(code).trim();

    // OWNER PIN VERIFICATION
    if (verifyType === "OWNER") {

        if (locker.isLockedOut || !locker.pin) {
            return NextResponse.json({
                mode: "LOCKED_OUT"
            });
        }

        if (locker.pin === inputCode) {
            await Locker.updateOne(
                { _id: locker._id },
                {
                    failedAttempts: 0,
                    isLockedOut: false
                }
            );

            return NextResponse.json({
                mode: "OWNER"
            });
        }

        const newAttempts =
            (locker.failedAttempts || 0) + 1;

        if (newAttempts >= 3) {
            await Locker.updateOne(
                { _id: locker._id },
                {
                    pin: null,
                    failedAttempts: newAttempts,
                    isLockedOut: true
                }
            );

            await Log.create({
                userId: locker.userId,
                lockerId: locker._id,
                actor: "system",
                action: "PIN_LOCKOUT",
                success: false,
                details: "3 failed PIN attempts reached."
            });

            return NextResponse.json({
                mode: "LOCKED_OUT"
            });
        }

        await Locker.updateOne(
            { _id: locker._id },
            { failedAttempts: newAttempts }
        );

        return NextResponse.json({
            mode: "INVALID",
            attemptsRemaining: 3 - newAttempts
        });
    }

    // DELIVERY TRACKING VERIFICATION

    if (verifyType === "DELIVERY") {

        const parcel = await Parcel.findOne({
            trackingNumber: inputCode,
            userId: new mongoose.Types.ObjectId(
                locker.userId.toString()
            ),
            status: "PENDING"
        });

        if (parcel) {
            parcel.status = "VERIFIED";
            await parcel.save();

            return NextResponse.json({
                mode: "DELIVERY"
            });
        }

        const existingParcel = await Parcel.findOne({
            trackingNumber: inputCode,
            userId: new mongoose.Types.ObjectId(
                locker.userId.toString()
            )
        });

        if (existingParcel) {
            return NextResponse.json({
                mode: "INVALID",
                details: "Parcel already processed or not pending"
            });
        }

        return NextResponse.json({
            mode: "INVALID",
            details: "Tracking number not found"
        });
    }

    // ==========================================
    // RETURN OTP VERIFICATION
    // ==========================================
    if (verifyType === "RETURN") {

        const returnDoc = await Return.findOne({
            otp: inputCode,
            lockerId: locker._id,
            status: "OTP_ACTIVE"
        });

        if (returnDoc) {
            if (returnDoc.otpExpiry && returnDoc.otpExpiry < new Date()) {
                returnDoc.status = "EXPIRED";
                await returnDoc.save();
                await Log.create({
                    userId: locker.userId,
                    lockerId: locker._id,
                    actor: "courier",
                    action: "RETURN_OTP_INVALID",
                    success: false,
                    details: "OTP expired"
                });
                return NextResponse.json({
                    mode: "INVALID",
                    details: "OTP expired"
                });
            }

            returnDoc.status = "PICKUP_ACTIVE";
            await returnDoc.save();

            return NextResponse.json({
                mode: "RETURN_PICKUP"
            });
        }

        return NextResponse.json({
            mode: "INVALID",
            details: "OTP not found or already used"
        });
    }

    return NextResponse.json({
        mode: "INVALID",
        details: "Invalid verification type"
    });
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


        if (
            action === "LOCK_OPEN" ||
            action === "LOCK_CLOSED" ||
            action === "PIN_VALID" ||
            action === "INVALID_CODE" ||
            action === "LID_OPEN_TOO_LONG"
        )
        {
            const locker = await Locker.findOne({ code: lockerCode });

            if (!locker)
            {
                return NextResponse.json(
                    { error: "Locker not found" },
                    { status: 404 }
                );
            }

            await Log.create({
                userId: locker.userId,
                lockerId: locker._id,
                actor: "system",
                action,
                success: action !== "INVALID_CODE",
                details: action
            });

            return NextResponse.json({ ok: true });
}

        if (action === "RETRIEVE" || action === "PARCEL_REMOVED") {
            const locker = await Locker.findOne({
                code: lockerCode
            });

            if (!locker) {
                return NextResponse.json(
                    { error: "Locker not found" },
                    { status: 404 }
                );
            }

            const deliveredParcels = await Parcel.find({
                userId: locker.userId,
                status: "DELIVERED"
            });

            const trackingNumbers =
                deliveredParcels.map(
                    (parcel) => parcel.trackingNumber
                );

            const retrievedDate = new Date();

            await Parcel.updateMany(
                {
                    _id: {
                        $in: deliveredParcels.map(
                            (parcel) => parcel._id
                        )
                    }
                },
                {
                    $set: {
                        status: "RETRIEVED",
                        retrievedDate
                    }
                }
            );

            await Log.create({
                userId: locker.userId,
                lockerId: locker._id,
                actor: "user",
                action: "RETRIEVE",
                success: true,
                details:
                    trackingNumbers.length > 0
                        ? `Parcels retrieved: ${trackingNumbers.join(",")}`
                        : "No delivered parcels found during retrieval"
            });

            return NextResponse.json({
                ok: true,
                trackingNumbers
            });
        }


        // ==========================================
        // RETURN DEPOSIT CONFIRMATION
        // Owner placed return parcel inside locker
        // ==========================================
        if (action === "RETURN_DEPOSITED") {

            const locker = await Locker.findOne({
                code: lockerCode
            });

            if (!locker) {
                return NextResponse.json(
                    { error: "Locker not found" },
                    { status: 404 }
                );
            }

            const returnDoc = await Return.findOne({
                lockerId: locker._id,
                userId: locker.userId,
                status: "PENDING"
            }).sort({ createdAt: -1 });

            if (!returnDoc) {
                return NextResponse.json(
                    { error: "No pending return found" },
                    { status: 404 }
                );
            }

            returnDoc.status = "READY_FOR_PICKUP";
            await returnDoc.save();

            await Log.create({
                userId: locker.userId,
                lockerId: locker._id,
                actor: "user",
                action: "RETURN_DEPOSITED",
                success: true,
                details: `Return ${returnDoc._id} deposited in locker`
            });

            return NextResponse.json({
                ok: true,
                returnId: returnDoc._id
            });
}

        // ==========================================
        // RETURN PHYSICAL PICKUP CONFIRMATION
        // ==========================================
        if (action === "RETURN_PICKED_UP") {

            const locker = await Locker.findOne({
                code: lockerCode
            });

            if (!locker) {
                return NextResponse.json(
                    { error: "Locker not found" },
                    { status: 404 }
                );
            }

            const returnDoc = await Return.findOne({
                lockerId: locker._id,
                status: "PICKUP_ACTIVE"
            }).sort({ updatedAt: -1 });

            if (!returnDoc) {
                return NextResponse.json(
                    { error: "No active return pickup" },
                    { status: 404 }
                );
            }

            returnDoc.status = "PICKED_UP";
            returnDoc.pickedUpDate = new Date();

            await returnDoc.save();

            await Log.create({
                userId: locker.userId,
                lockerId: locker._id,
                actor: "courier",
                action: "RETURN_PICKUP_SUCCESS",
                success: true,
                details: `Return ${returnDoc._id} picked up`
            });

            return NextResponse.json({
                ok: true,
                returnId: returnDoc._id
            });
        }


        return NextResponse.json({ mode: "INVALID" });

    } catch (err: any) {
        console.error("IOT_ERROR:", err.message);
        return NextResponse.json({ error: "server error" }, { status: 500 });
    }
}