import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  stripeCustomerId: text('stripe_customer_id'),
  subscriptionStatus: text('subscription_status').default('inactive'),
  credits: integer('credits').default(0),
  username: text('username').default('Shaggy'),
  tier: text('tier').default('free'),
  access: text('access').default('Alpha'),
  shippingName: text('shipping_name'),
  shippingAddress: text('shipping_address'),
  shippingCity: text('shipping_city'),
  shippingZip: text('shipping_zip'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const scans = sqliteTable('scans', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  substanceName: text('substance_name'),
  resultData: text('result_data'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  stripeSessionId: text('stripe_session_id').unique(),
  amount: integer('amount'),
  currency: text('currency').default('usd'),
  status: text('status'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  status: text('status'),
  priceId: text('price_id'),
  currentPeriodEnd: text('current_period_end'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
