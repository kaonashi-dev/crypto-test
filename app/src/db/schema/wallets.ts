import { pgTable, serial, varchar, timestamp, text, decimal, integer, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { merchants } from './merchants';

export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  merchantId: integer('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  address: varchar('address', { length: 255 }).notNull(),
  privateKeyEncrypted: text('private_key_encrypted'),
  network: varchar('network', { length: 20 }).notNull(), // BTC, ETH, POLYGON, BNB, TRON
  coin: varchar('coin', { length: 20 }).notNull(), // BTC, ETH, USDT, MATIC, BNB, TRX
  balance: decimal('balance', { precision: 20, scale: 8 }).notNull().default('0'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    merchantNetworkCoinUnique: unique().on(table.merchantId, table.network, table.coin),
  };
});

// Relations
export const walletsRelations = relations(wallets, ({ one }) => ({
  merchant: one(merchants, {
    fields: [wallets.merchantId],
    references: [merchants.id],
  }),
}));

// Zod schemas for validation
export const insertWalletSchema = createInsertSchema(wallets, {
  network: z.enum(['BTC', 'ETH', 'POLYGON', 'BNB', 'TRON']),
  coin: z.enum(['BTC', 'ETH', 'USDT', 'MATIC', 'BNB', 'TRX']),
  status: z.enum(['active', 'inactive']).default('active'),
  balance: z.string().regex(/^\d+(\.\d{1,8})?$/).default('0'),
});

export const selectWalletSchema = createSelectSchema(wallets);

// Type exports
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
