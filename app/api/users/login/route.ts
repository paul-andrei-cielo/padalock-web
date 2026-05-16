import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // HANDLE SOFT DELETE
    if (user.isDeleted) {
      if (!user.deletedAt) {
        return Response.json(
          { error: "Account is deactivated" },
          { status: 403 }
        );
      }

      const now = new Date();
      const deletedDate = new Date(user.deletedAt);

      const diffDays =
        (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays <= 30) {
        // RESTORE ACCOUNT
        user.isDeleted = false;
        user.deletedAt = null;
        await user.save();
      } else {
        // PERMANENT DELETE AFTER 30 DAYS
        await User.findByIdAndDelete(user._id);
        return Response.json(
          { error: "Account permanently deleted" },
          { status: 403 }
        );
      }
    }

    // PASSWORD CHECK
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({
      userId: user._id,
      email: user.email,
    });

    return Response.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}