import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { turso, initDatabase } from '@/services/turso';
import { dbService } from '@/services/dbService';

/**
 * Verifies ECDSA SHA-256 signature using SPKI public key in base64.
 * Handles both IEEE P1363 (WebCrypto standard output) and ASN.1 DER formats.
 */
export function verifySignature(publicKeyB64: string, message: string, signatureB64: string): boolean {
  try {
    const formattedKey = publicKeyB64.match(/.{1,64}/g)?.join('\n') || publicKeyB64;
    const pubKeyPem = `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`;
    const signatureBuf = Buffer.from(signatureB64, 'base64');

    // 1. Try IEEE P1363 format first (standard browser WebCrypto subtle.sign output)
    try {
      const verifierIeee = crypto.createVerify('SHA256');
      verifierIeee.update(message);
      verifierIeee.end();
      if (verifierIeee.verify({ key: pubKeyPem, dsaEncoding: 'ieee-p1363' }, signatureBuf)) {
        return true;
      }
    } catch {
      // Fall through to DER verification
    }

    // 2. Try DER-encoded format
    const verifierDer = crypto.createVerify('SHA256');
    verifierDer.update(message);
    verifierDer.end();
    return verifierDer.verify(pubKeyPem, signatureBuf);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * Challenge-response / Signature-based upsert endpoint for secure asymmetric authentication.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { publicKey, signature, timestamp } = body;

    if (!publicKey || !signature || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required authentication fields.' },
        { status: 400 }
      );
    }

    // Reject requests older than 5 minutes to prevent replay attacks
    const now = Date.now();
    if (Math.abs(now - Number(timestamp)) > 5 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Authentication payload expired.' },
        { status: 401 }
      );
    }

    // Verify the client actually holds the private key for this public key
    const message = `auth:${publicKey}:${timestamp}`;
    const isValid = verifySignature(publicKey, message, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature. Keypair mismatch or impersonation detected.' },
        { status: 403 }
      );
    }

    // Upsert into Turso: insert new user or update last_login if verified
    await initDatabase();
    await turso.execute({
      sql: `INSERT INTO users (public_key, last_login)
            VALUES (?, CURRENT_TIMESTAMP)
            ON CONFLICT(public_key) DO UPDATE SET
              last_login = CURRENT_TIMESTAMP`,
      args: [publicKey],
    });

    const user = await dbService.getUser(publicKey);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Sync identity endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
