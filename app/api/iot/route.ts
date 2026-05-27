    import { NextRequest, NextResponse } from "next/server";
    import { connectDB } from "@/lib/mongodb";
    import Parcel from "@/models/Parcel";
    import Locker from "@/models/Locker";
    import Log from "@/models/Log"; 

    export async function POST(req: NextRequest) {
        try {
            await connectDB();

                const { code, action, lockerCode } = await req.json();

                console.log("========== IOT REQUEST ==========");
                console.log("ACTION:", action);
                console.log("CODE:", code);
                console.log("LOCKER:", lockerCode);
                console.log("=================================");

            // =========================
            // VERIFY PIN OR TRACKING NUMBER
            // =========================
            if (action === "VERIFY") {
                const locker = await Locker.findOne({ code: lockerCode });

                if (!locker) {
                    return NextResponse.json({ error: "Locker hardware not registered" }, { status: 404 });
                }

                if (!locker.pin) {
                    return NextResponse.json({ mode: "LOCKED_OUT" });
                }

                if (locker.pin === code) {
                    await Locker.updateOne({ _id: locker._id }, { failedAttempts: 0 });
                    
                    return NextResponse.json({ mode: "OWNER" });
                }

                const parcel = await Parcel.findOne({
                    trackingNumber: code,
                    status: "PENDING"
                });

                if (parcel) {
                    parcel.status = "VERIFIED";
                    await parcel.save();
                    await Locker.updateOne({ _id: locker._id }, { failedAttempts: 0 });

                    return NextResponse.json({ mode: "DELIVERY" });
                }

                const newAttempts = (locker.failedAttempts || 0) + 1;
                
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
                        details: "3 failed attempts reached. PIN nulled."
                    });

                    return NextResponse.json({ mode: "LOCKED_OUT" });
                } else {
                    await Locker.updateOne(
                        { _id: locker._id }, 
                        { failedAttempts: newAttempts }
                    );

                    return NextResponse.json({ 
                        mode: "INVALID",
                        attemptsRemaining: 3 - newAttempts 
                    });
                }
            }

            if (action === "DELIVERED") {

                console.log("DELIVERED ACTION RECEIVED");

                const locker = await Locker.findOne({
                    code: lockerCode
                });

                console.log("LOCKER CODE:", lockerCode);
                console.log("LOCKER FOUND:", locker);

                if (!locker) {
                console.log("LOCKER NOT FOUND");
                return NextResponse.json({
                    error: "Locker not found"
                }, { status: 404 });
            }

                const verifiedParcels = await Parcel.find({
                    userId: locker?.userId,
                    status: "VERIFIED"
                });

                console.log("VERIFIED PARCELS:", verifiedParcels);

                for (const parcel of verifiedParcels)
                {
                    parcel.status = "DELIVERED";
                    parcel.deliveryDate = new Date();

                    await parcel.save();

                    await Log.create({
                        userId: parcel.userId,
                        lockerId: locker._id,
                        actor: "courier",
                        action: "DELIVERY_VALID",
                        success: true,
                        details: `${parcel.trackingNumber} delivered`,
                        timestamp: new Date()
                    });
                }

                return NextResponse.json({
                    ok: true
                });
            }

            // =========================
            // OWNER RETRIEVED PARCEL
            // =========================
            if (action === "RETRIEVE") {

                const locker = await Locker.findOne({
                        code: lockerCode
                    });

                    if (!locker) {
                        return NextResponse.json({
                            error: "Locker not found"
                        }, { status: 404 });
                    }

                    const deliveredParcels = await Parcel.find({
                        userId: locker.userId,
                        status: "DELIVERED"
                    });

                await Parcel.updateMany(
                    {
                        userId: locker.userId,
                        status: "DELIVERED"
                    },
                    {
                        $set: {
                            status: "RETRIEVED",
                            retrievedDate: new Date()
                        }
                    }
                );

                for (const parcel of deliveredParcels) {

                    const locker = await Locker.findOne({
                        userId: parcel.userId
                    });

                    await Log.create({
                        userId: parcel.userId,
                        lockerId: locker?._id,
                        actor: "user",
                        action: "RETRIEVE",
                        success: true,
                        details: `${parcel.trackingNumber} retrieved`,
                        timestamp: new Date()
                    });
                }

                return NextResponse.json({
                    ok: true
                });
            }

            if (
                action === "PIN_VALID" ||
                action === "INVALID_CODE" ||
                action === "LOCK_OPEN" ||
                action === "LOCK_CLOSED" ||
                action === "PIN_LOCKOUT" ||
                action === "PIN_RESET" ||
                action === "LID_OPEN_TOO_LONG"
            ) {

                const locker = await Locker.findOne({
                    code: lockerCode
                });

                if (!locker) {
                    return NextResponse.json({
                        error: "Locker not found"
                    }, { status: 404 });
                }

                await Log.create({
                    userId: locker.userId,
                    lockerId: locker._id,
                    actor: "system",
                    action,
                    success: true,
                    details: action,
                    timestamp: new Date()
                });

                return NextResponse.json({
                    ok: true
                });
            }

            return NextResponse.json({
                mode: "INVALID"
            });

        } catch (err) {
            console.error(err);

            return NextResponse.json(
                { error: "server error" },
                { status: 500 }
            );
        }
    }