import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { turso, initDatabase } from '@/services/turso';
import { dbService } from '@/services/dbService';
import { hashPrivateKey, verifyPrivateKeyHash } from '@/services/authSecurity';

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
 * Challenge-response / Signature-based upsert endpoint with salted private key hash verification.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { publicKey, privateKey, signature, timestamp } = body;

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

    // 1. Verify the client signature cryptographically
    const message = `auth:${publicKey}:${timestamp}`;
    const isValidSignature = verifySignature(publicKey, message, signature);

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid signature. Keypair mismatch or impersonation detected.' },
        { status: 403 }
      );
    }

    await initDatabase();
    const existingUser = await dbService.getUser(publicKey);

    // 2. Actually determine private key matches salted hash in db (anti-impersonation)
    if (existingUser) {
      if (existingUser.privateKeyHash) {
        if (!privateKey || !verifyPrivateKeyHash(privateKey, existingUser.privateKeyHash)) {
          return NextResponse.json(
            { error: 'Unauthorized: Private key does not match the registered salted hash in database. Impersonation rejected.' },
            { status: 403 }
          );
        }
      } else if (privateKey) {
        // Populate salted hash for user registered prior to private_key_hash column
        const saltedHash = hashPrivateKey(privateKey);
        await dbService.upsertUser({
          publicKey,
          privateKeyHash: saltedHash,
        });
      }
    } else {
      // New user registration: store salted private key hash in users table
      const saltedHash = privateKey ? hashPrivateKey(privateKey) : null;
      await dbService.upsertUser({
        publicKey,
        privateKeyHash: saltedHash || undefined,
        tier: 'free',
        access: 'Alpha',
      });
    }

    // Update last_login
    await dbService.upsertUser({
      publicKey,
      lastLogin: new Date().toISOString(),
    });

    const user = await dbService.getUser(publicKey);
    if (!user) {
      return NextResponse.json({ error: 'User could not be retrieved.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.publicKey,
        publicKey: user.publicKey,
        username: user.username,
        tier: user.tier,
        access: user.access,
        shippingName: user.shippingName,
        shippingAddress: user.shippingAddress,
        shippingCity: user.shippingCity,
        shippingZip: user.shippingZip,
      },
    });
  } catch (error: any) {
    console.error('Sync identity endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

