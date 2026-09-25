import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdminRequest } from '@/services/adminAuth';
import { dbService } from '@/services/dbService';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateAdminRequest(req);
    if (authResult.authorized === false) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await dbService.getAllScansDetailed(limit, offset);

    return NextResponse.json({
      success: true,
      scans: result.items,
      totalCount: result.totalCount,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Admin scans route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
