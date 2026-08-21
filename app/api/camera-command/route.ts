import { NextRequest, NextResponse } from "next/server";

type CameraCommand = {
  lockerCode: string;
  command: "START" | "STOP";
  eventType?: "DELIVERY" | "RETRIEVE";
  trackingNumber?: string;
  updatedAt: number;
};

let latestCommand: CameraCommand | null = null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      lockerCode,
      command,
      eventType,
      trackingNumber
    } = body;

    if (!lockerCode || !command) {
      return NextResponse.json(
        { error: "lockerCode and command are required" },
        { status: 400 }
      );
    }

    if (command !== "START" && command !== "STOP") {
      return NextResponse.json(
        { error: "Invalid command" },
        { status: 400 }
      );
    }

    latestCommand = {
      lockerCode,
      command,
      eventType,
      trackingNumber,
      updatedAt: Date.now()
    };

    return NextResponse.json({
      ok: true,
      command: latestCommand
    });

  } catch (error) {
    console.error("CAMERA COMMAND POST ERROR:", error);

    return NextResponse.json(
      { error: "Failed to save camera command" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const lockerCode = searchParams.get("lockerCode");

    if (!lockerCode) {
      return NextResponse.json(
        { error: "lockerCode is required" },
        { status: 400 }
      );
    }

    if (
      !latestCommand ||
      latestCommand.lockerCode !== lockerCode
    ) {
      return NextResponse.json({
        command: "NONE"
      });
    }

    return NextResponse.json(latestCommand);

  } catch (error) {
    console.error("CAMERA COMMAND GET ERROR:", error);

    return NextResponse.json(
      { error: "Failed to get camera command" },
      { status: 500 }
    );
  }
}