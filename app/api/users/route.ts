import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/services/dbService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await dbService.upsertUser(body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
