import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { hashPrivateKey } from '@/services/authSecurity';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, privateKey, priceId, amount, productName, metadata } = body;

    const saltedHash = privateKey ? hashPrivateKey(privateKey) : undefined;
    const sessionMetadata: Record<string, string> = {
      ...(metadata || {}),
      ...(saltedHash ? { privateKeyHash: saltedHash } : {}),
    };

    const stripe = getStripe();

    const line_items =
      priceId && priceId.startsWith('price_') && priceId !== 'price_XXXXX'
        ? [
            {
              price: priceId,
              quantity: 1,
            },
          ]
        : [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: productName || 'Purple Canary Unlimited Pro License',
                },
                unit_amount: amount ? Math.round(Number(amount) * 100) : 100,
              },
              quantity: 1,
            },
          ];

    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      client_reference_id: userId,
      line_items,
      metadata: sessionMetadata,
      success_url: `${origin}/scan?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout session creation error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create Stripe Checkout session.' },
      { status: 500 }
    );
  }
}
