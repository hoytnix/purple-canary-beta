import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { dbService } from '@/services/dbService';

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.startsWith('sk_test_placeholder') || secretKey === 'sk_test_...') {
    throw new Error('STRIPE_SECRET_KEY is not configured in environment variables.');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const isPaid = session.payment_status === 'paid';
    const userId = session.client_reference_id;

    if (isPaid && userId) {
      // Ensure user transaction and unlimited tier are recorded idempotently in Turso
      try {
        await dbService.recordTransaction({
          id: session.id,
          userId,
          stripeSessionId: session.id,
          amount: session.amount_total || 0,
          status: session.payment_status,
        });

        // ONLY IF IT DOESN'T EXIST: insert user, otherwise update tier
        const existingUser = await dbService.getUser(userId);
        const meta = (session.metadata || {}) as Record<string, string>;

        if (!existingUser) {
          await dbService.upsertUser({
            publicKey: userId,
            username: meta.username || 'Shaggy',
            tier: 'unlimited',
            access: 'Alpha',
            shippingName: meta.shippingName || null,
            shippingAddress: meta.shippingAddress || null,
            shippingCity: meta.shippingCity || null,
            shippingZip: meta.shippingZip || null,
            lastLogin: new Date().toISOString(),
          });
        } else {
          await dbService.upsertUser({
            publicKey: userId,
            tier: 'unlimited',
            ...(meta.shippingName && { shippingName: meta.shippingName }),
            ...(meta.shippingAddress && { shippingAddress: meta.shippingAddress }),
            ...(meta.shippingCity && { shippingCity: meta.shippingCity }),
            ...(meta.shippingZip && { shippingZip: meta.shippingZip }),
            lastLogin: new Date().toISOString(),
          });
        }
      } catch (dbErr) {
        console.error('Error recording session in dbService:', dbErr);
      }

      return NextResponse.json({
        verified: true,
        userId,
        status: session.payment_status,
        tier: 'unlimited',
      });
    }

    return NextResponse.json({
      verified: isPaid,
      userId: userId || null,
      status: session.payment_status,
      tier: isPaid ? 'unlimited' : 'free',
    });
  } catch (err: any) {
    console.error('Session verification error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to verify session' },
      { status: 500 }
    );
  }
}
