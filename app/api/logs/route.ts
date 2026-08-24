import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Log from '@/models/Log';
import { getUserFromRequest } from '@/lib/auth';
import Return from '@/models/Return';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = new mongoose.Types.ObjectId(
      user.id || user.userId
    );

    console.log("Fetching logs for:", userId);

    const logs = await Log.find({ userId })
  .sort({ createdAt: -1 })
  .limit(50)
  .lean();

    const enrichedLogs = await Promise.all(
      logs.map(async (log: any) => {
        if (log.action !== "RETURN_PICKUP_SUCCESS") {
          return log;
        }

        const match = log.details?.match(
          /Return ([a-fA-F0-9]{24}) picked up/
        );

        if (!match) {
          return log;
        }

        const returnDoc = await Return.findOne({
          _id: match[1],
          userId,
        })
          .select("parcelCount items itemDescription")
          .lean();

        return {
          ...log,
          returnInfo: returnDoc || null,
        };
      })
    );

    return NextResponse.json(enrichedLogs);

  } catch (error: any) {
    console.error('Error fetching logs:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
