import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/services/dbService';

export async function POST() {
  return NextResponse.json(
    { error: 'Direct user mutation is deprecated. Use /api/auth/sync-identity with cryptographic keypair authentication.' },
    { status: 405 }
  );
}
