import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdminRequest } from '@/services/adminAuth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateAdminRequest(req);
    if (authResult.authorized === false) {
      return authResult.response;
    }

    return NextResponse.json({
      authorized: true,
      user: {
        publicKey: authResult.user.publicKey,
        username: authResult.user.username,
        tier: authResult.user.tier,
        access: authResult.user.access,
        lastLogin: authResult.user.lastLogin,
      },
    });
  } catch (error: any) {
    console.error('Admin auth check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
