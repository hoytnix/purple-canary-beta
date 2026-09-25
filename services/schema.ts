import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  publicKey: text('public_key').primaryKey(),
  privateKeyHash: text('private_key_hash'),
  nonce: integer('nonce').default(0),
  stripeCustomerId: text('stripe_customer_id'),
  username: text('username').default('Shaggy'),
  tier: text('tier').default('free'),
  access: text('access').default('Alpha'),
  shippingName: text('shipping_name'),
  shippingAddress: text('shipping_address'),
  shippingCity: text('shipping_city'),
  shippingZip: text('shipping_zip'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  lastLogin: text('last_login').default(sql`(CURRENT_TIMESTAMP)`),
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
