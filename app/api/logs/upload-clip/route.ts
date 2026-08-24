import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongodb";
import Parcel from "@/models/Parcel";
import Log from "@/models/Log";
import Locker from "@/models/Locker";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const eventType = formData.get("eventType") as string;
    const lockerCode = formData.get("lockerCode") as string;
    const trackingNumber = formData.get("trackingNumber") as string | null;

    if (!file || !eventType || !lockerCode) {
      return NextResponse.json(
        {
          error: "Missing file, eventType, or lockerCode",
        },
        { status: 400 }
      );
    }

    if (
      eventType !== "DELIVERY" &&
      eventType !== "RETRIEVE" &&
      eventType !== "RETURN_DEPOSIT" &&
      eventType !== "RETURN_PICKUP"
    ) {
      return NextResponse.json(
        { error: "Invalid eventType" },
        { status: 400 }
      );
    }

    const locker = await Locker.findOne({
      code: lockerCode,
    });

    if (!locker) {
      return NextResponse.json(
        { error: "Locker not found" },
        { status: 404 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result: any = await new Promise(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "video",
              folder: "padalock-clips",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      }
    );

    const playbackUrl = cloudinary.url(result.public_id, {
      resource_type: "video",
      format: "mp4",
      secure: true,
    });

    // DELIVERY

    if (eventType === "DELIVERY") {
      const trackingNumbers =
        trackingNumber
          ?.split(",")
          .map((number) => number.trim())
          .filter(Boolean) || [];

      console.log(
        "DELIVERY TRACKING NUMBERS:",
        trackingNumbers
      );

      if (trackingNumbers.length > 0) {
        const parcelUpdate = await Parcel.updateMany(
          {
            trackingNumber: {
              $in: trackingNumbers,
            },
            userId: locker.userId,
          },
          {
            $set: {
              videoUrl: playbackUrl,
            },
          }
        );

        console.log(
          "DELIVERY PARCEL VIDEO UPDATE:",
          parcelUpdate
        );
      }

      for (const number of trackingNumbers) {
        const updatedDeliveryLog =
          await Log.findOneAndUpdate(
            {
              lockerId: locker._id,
              userId: locker.userId,
              action: {
                $in: [
                  "DELIVERY_SUCCESS",
                  "DELIVERY_VALID",
                ],
              },
              details: {
                $regex: number,
                $options: "i",
              },
            },
            {
              cameraRecording: playbackUrl,
            },
            {
              sort: { createdAt: -1 },
              new: true,
            }
          );

        console.log(
          `DELIVERY LOG UPDATE ${number}:`,
          updatedDeliveryLog
        );
      }
    }

    // RETRIEVAL

    if (eventType === "RETRIEVE") {
      await Log.findOneAndUpdate(
        {
          lockerId: locker._id,
          userId: locker.userId,
          action: "RETRIEVE",
        },
        
        {
          cameraRecording: playbackUrl,
        },
        {
          sort: { createdAt: -1 },
          new: true,
        }
      );
    }

    // RETURN DEPOSIT

if (eventType === "RETURN_DEPOSIT") {
  const updatedLog = await Log.findOneAndUpdate(
    {
      lockerId: locker._id,
      userId: locker.userId,
      action: "RETURN_DEPOSITED",
    },
    {
      cameraRecording: playbackUrl,
    },
    {
      sort: { createdAt: -1 },
      new: true,
    }
  );

  console.log(
    "RETURN DEPOSIT CLIP LOG UPDATE:",
    updatedLog
  );
}

    // RETURN PICKUP

    if (eventType === "RETURN_PICKUP") {
      const updatedLog = await Log.findOneAndUpdate(
        {
          lockerId: locker._id,
          userId: locker.userId,
          action: "RETURN_PICKUP_SUCCESS",
        },
        {
          cameraRecording: playbackUrl,
        },
        {
          sort: { createdAt: -1 },
          new: true,
        }
      );

      console.log(
        "RETURN PICKUP CLIP LOG UPDATE:",
        updatedLog
      );
    }

    return NextResponse.json({
      message: "Clip uploaded successfully",
      videoUrl: playbackUrl,
      eventType,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}