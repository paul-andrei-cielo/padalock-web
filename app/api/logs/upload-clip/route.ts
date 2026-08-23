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
      eventType !== "RETRIEVE"
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
      if (trackingNumber) {
        await Parcel.findOneAndUpdate(
          {
            trackingNumber,
            userId: locker.userId,
          },
          {
            videoUrl: playbackUrl,
          },
          {
            new: true,
          }
        );
      }

      await Log.findOneAndUpdate(
        {
          lockerId: locker._id,
          userId: locker.userId,
          action: {
            $in: ["DELIVERY_SUCCESS", "DELIVERY_VALID"],
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