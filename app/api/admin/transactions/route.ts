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

    const txs = await dbService.getAllTransactions(limit);

    return NextResponse.json({
      success: true,
      transactions: txs,
      totalCount: txs.length,
    });
  } catch (error: any) {
    console.error('Admin transactions route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
