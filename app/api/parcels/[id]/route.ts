import { getUserFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Parcel from "@/models/Parcel";
import { NextRequest, NextResponse } from "next/server";
import Log from "@/models/Log";
import cloudinary from "@/lib/cloudinary";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();

    const user = getUserFromRequest(req);

    if (!user?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const parcel = await Parcel.findOne({
      _id: id,
      userId: user.userId
    });

    if (!parcel) {
      return NextResponse.json(
        {
          error:
            "Parcel not found or doesn't belong to you"
        },
        { status: 404 }
      );
    }

    const trackingNumber = parcel.trackingNumber;

    const relatedLogs = await Log.find({
      userId: user.userId,
      $or: [
        {
          action: {
            $in: [
              "DELIVERY_VALID",
              "DELIVERY_SUCCESS",
              "RETRIEVE"
            ]
          },
          details: {
            $regex: trackingNumber,
            $options: "i"
          }
        }
      ]
    });

    for (const log of relatedLogs) {
      if (!log.cameraRecording) continue;

      try {
        const url = new URL(log.cameraRecording);

        const uploadIndex =
          url.pathname.indexOf("/upload/");

        if (uploadIndex >= 0) {
          let publicPath =
            url.pathname.substring(
              uploadIndex + 8
            );

          publicPath = publicPath.replace(
            /^v\d+\//,
            ""
          );

          publicPath = publicPath.replace(
            /\.mp4$/,
            ""
          );

          await cloudinary.uploader.destroy(
            publicPath,
            {
              resource_type: "video"
            }
          );
        }
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete parcel clip:",
          cloudinaryError
        );
      }
    }

    await Log.deleteMany({
      userId: user.userId,
      action: {
        $in: [
          "DELIVERY_VALID",
          "DELIVERY_SUCCESS",
          "RETRIEVE"
        ]
      },
      details: {
        $regex: trackingNumber,
        $options: "i"
      }
    });

    await Parcel.deleteOne({
      _id: id,
      userId: user.userId
    });

    return NextResponse.json({
      message:
        "Parcel and related activity deleted successfully"
    });

  } catch (error: any) {
    console.error(
      "Delete parcel error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete parcel: " +
          error.message
      },
      { status: 500 }
    );
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

        const { trackingNumber, parcelName } = body;

        if (!trackingNumber || typeof trackingNumber !== 'string' || trackingNumber.trim().length === 0) {
            return NextResponse.json({ 
                error: "Tracking number is required" 
            }, { status: 400 });
        }

        const updatedParcel = await Parcel.findOneAndUpdate(
            { _id: id, userId: user.userId },
            { 
                trackingNumber: trackingNumber.trim(),
                parcelName: parcelName?.trim() || "Parcel",
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!updatedParcel) {
            return NextResponse.json({ 
                error: "Parcel not found or doesn't belong to you" 
            }, { status: 404 });
        }

        return NextResponse.json({
            message: "Parcel updated successfully",
            parcel: updatedParcel
        });
    } catch (error: any) {
        console.error("Update parcel error:", error);
        return NextResponse.json({ 
            error: "Failed to update parcel: " + error.message 
        }, { status: 500 });
    }
}