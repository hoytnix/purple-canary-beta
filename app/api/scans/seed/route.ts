import { NextResponse } from 'next/server';
import { dbService } from '@/services/dbService';

export async function POST() {
  try {
    await dbService.seedScansIfEmpty();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
