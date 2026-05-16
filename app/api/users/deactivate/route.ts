import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const decoded: any = getUserFromRequest(req);
    const { password } = await req.json();

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();

    await user.save();

    return NextResponse.json({ message: "Account deactivated for 30 days" });

  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}