import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const user = getUserFromRequest(req);
    const userId = user.id || user.userId;

    await User.findByIdAndUpdate(userId, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    return NextResponse.json({ message: "Account deactivated" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to deactivate" }, { status: 500 });
  }
}