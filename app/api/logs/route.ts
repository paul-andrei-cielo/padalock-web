import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Log from '@/models/Log';
import { getUserFromRequest } from '@/lib/auth';
import Return from '@/models/Return';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOTIFICATION_ACTIONS = [
  'DELIVERY_SUCCESS',
  'RETRIEVE',
  'RETURN_PICKUP_SUCCESS',
  'INVALID_CODE',
  'PIN_LOCKOUT',
  'LID_OPEN_TOO_LONG',
];

const RETURN_LOG_ACTIONS = ['RETURN_PICKUP_SUCCESS', 'RETURN_DEPOSITED'];

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

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

    const params = request.nextUrl.searchParams;

    const query: Record<string, any> = { userId };
    if (params.get('type') === 'notifications') {
      query.action = { $in: NOTIFICATION_ACTIONS };
    }

    const requestedLimit = Number(params.get('limit'));
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const enrichedLogs = await Promise.all(
      logs.map(async (log: any) => {
        if (!RETURN_LOG_ACTIONS.includes(log.action)) {
          return log;
        }

        const match = log.details?.match(
          /Return ([a-fA-F0-9]{24}) (?:picked up|deposited in locker)/
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