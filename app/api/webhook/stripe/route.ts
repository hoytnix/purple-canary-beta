import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { dbService } from '@/services/dbService';

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured in environment variables.');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret || webhookSecret.startsWith('whsec_placeholder') || webhookSecret === 'whsec_...') {
    return new NextResponse('STRIPE_WEBHOOK_SECRET or signature is not configured.', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Stripe Webhook Error:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;

    if (userId) {
      await dbService.recordTransaction({
        id: session.id,
        userId,
        stripeSessionId: session.id,
        amount: session.amount_total || 0,
        status: session.payment_status,
      });

      // Grant credits or activate membership
      const user = await dbService.getUser(userId);
      await dbService.upsertUser({
        id: userId,
        subscriptionStatus: 'active',
        tier: 'unlimited',
        credits: (user?.credits || 0) + 10,
      });
    }
  }

  return NextResponse.json({ received: true });
}
