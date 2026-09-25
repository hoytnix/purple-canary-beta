import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/services/dbService';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (userId) {
      const items = await dbService.getScansForUser(userId);
      return NextResponse.json({ items });
    }

    const limitParam = searchParams.get('limit');
    const limitCount = limitParam ? parseInt(limitParam) : 30;
    const data = await dbService.getAllLatestScans(limitCount);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, substanceName, resultData } = body;

    await dbService.recordScan({
      id: id || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      substanceName: substanceName || resultData?.verdict || 'Scan',
      resultData,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
