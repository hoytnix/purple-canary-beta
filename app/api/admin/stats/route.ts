import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdminRequest } from '@/services/adminAuth';
import { dbService } from '@/services/dbService';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateAdminRequest(req);
    if (authResult.authorized === false) {
      return authResult.response;
    }

    const stats = await dbService.getAdminStats();
    return NextResponse.json({
      success: true,
      stats,
      authenticatedAs: authResult.user.publicKey,
    });
  } catch (error: any) {
    console.error('Admin stats route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
