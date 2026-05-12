import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const decoded: any = getUserFromRequest(req);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: user.toObject() });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const decoded: any = getUserFromRequest(req);

    const { firstName, lastName } = await req.json();

    if (!firstName || firstName.trim() === "" || !lastName || lastName.trim() === "") {
      return NextResponse.json(
        { error: "First name and last name are required" }, 
        { status: 400 }
      );
    }

    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password: _, ...userResponse } = updatedUser.toObject();

    return NextResponse.json({ 
      message: "Profile updated successfully", 
      user: userResponse 
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const decoded: any = getUserFromRequest(req);

    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    await User.findByIdAndDelete(decoded.userId);

    return NextResponse.json({
      message: "Account permanently deleted",
    });

  } catch (error) {
    console.error("Delete account error:", error);

    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const decoded: any = getUserFromRequest(req);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isDeleted) {
      return NextResponse.json(
        { error: "Account already deactivated" },
        { status: 400 }
      );
    }

    // SOFT DELETE
    user.isDeleted = true;
    user.deletedAt = new Date();

    await user.save();

    return NextResponse.json({ message: "Account deactivated (30 days)" });
  } catch (error) {
    console.error("Deactivate error:", error);
    return NextResponse.json({ error: "Deactivate failed" }, { status: 500 });
  }
}