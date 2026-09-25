import { NextRequest, NextResponse } from 'next/server';
import { dbService, UserRecord } from './dbService';
import { verifySignature } from '@/app/api/auth/sync-identity/route';

export interface AdminAuthSuccess {
  authorized: true;
  user: UserRecord;
}

export interface AdminAuthFailure {
  authorized: false;
  response: NextResponse;
}

export type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure;

/**
 * Server-side guard that cryptographically authenticates the admin requester
 * and verifies that their `tier` in TursoDB is strictly 'admin'.
 */
export async function authenticateAdminRequest(req: NextRequest): Promise<AdminAuthResult> {
  const publicKey = req.headers.get('x-public-key');
  const timestamp = req.headers.get('x-timestamp');
  const signature = req.headers.get('x-signature');

  if (!publicKey || !timestamp || !signature) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Missing admin credentials. Include x-public-key, x-timestamp, and x-signature headers.' },
        { status: 401 }
      ),
    };
  }

  // Reject requests older than 5 minutes to prevent replay attacks
  const now = Date.now();
  if (Math.abs(now - Number(timestamp)) > 5 * 60 * 1000) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Admin authentication challenge expired. Please re-authenticate.' },
        { status: 401 }
      ),
    };
  }

  // Cryptographically verify signature against challenge: admin-auth:${publicKey}:${timestamp}
  const challenge = `admin-auth:${publicKey}:${timestamp}`;
  const isValidSig = verifySignature(publicKey, challenge, signature);
  if (!isValidSig) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Cryptographic signature mismatch. Impersonation rejected.' },
        { status: 403 }
      ),
    };
  }

  // Look up user directly in TursoDB
  await dbService.init();
  const user = await dbService.getUser(publicKey);

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Public key not registered in TursoDB.' },
        { status: 404 }
      ),
    };
  }

  // Strict Tier Enforcement: MUST BE 'admin'
  if (user.tier !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: 'Clearance Denied: Administrator tier required.',
          currentTier: user.tier,
          requiredTier: 'admin',
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user };
}
