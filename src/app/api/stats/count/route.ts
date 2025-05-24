import { NextRequest, NextResponse } from 'next/server';
import UserModel from '@/src/models/User';
import VideoModel from '@/src/models/Video';
import { executeWithRetry } from '@/src/lib/db';

export async function GET(req: NextRequest) {

  console.log("GET /api/stats/count");

  try {
    const [userCount, videoCount] = await Promise.all([
      executeWithRetry(async () => {
        return await UserModel.countDocuments({});
      }),
      executeWithRetry(async () => {
        return await VideoModel.countDocuments({});
      })
    ]);

    return NextResponse.json({
      data: {
        users: userCount,
        videos: videoCount
      }
    });
  } catch (error) {
    console.error("Error while fetching stats:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 