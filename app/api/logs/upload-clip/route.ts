import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongodb";
import Parcel from "@/models/Parcel";
import Log from "@/models/Log";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const trackingNumber = formData.get("trackingNumber") as string;

    if (!file || !trackingNumber) {
      return NextResponse.json(
        { error: "Missing file or trackingNumber" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result: any = await new Promise((resolve, reject) => {
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
    });

    const updatedParcel = await Parcel.findOneAndUpdate(
      { trackingNumber },
      { videoUrl: result.secure_url },
      { new: true }
    );

    try {
      await Log.findOneAndUpdate(
        {
          action: { $in: ["RETRIEVE", "DELIVERY_VALID"] }
        },
        {
          cameraRecording: result.secure_url
        },
        {
          sort: { createdAt: -1 }
        }
      );
    } catch (err) {
      console.error("Log update failed:", err);
    }

    return NextResponse.json({
      message: "Video uploaded successfully",
      videoUrl: result.secure_url,
      parcel: updatedParcel,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}