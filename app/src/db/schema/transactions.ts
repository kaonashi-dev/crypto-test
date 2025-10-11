import { pgTable, serial, varchar, timestamp, decimal, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { wallets } from './wallets';

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  walletId: integer('wallet_id').references(() => wallets.id, { onDelete: 'cascade' }), // Make optional for new transactions
  txHash: varchar('tx_hash', { length: 255 }).notNull().unique(),
  amount: decimal('amount', { precision: 20, scale: 8 }).notNull(),
  type: varchar('type', { length: 20 }).notNull().$type<'send' | 'receive' | 'request'>(),
  status: varchar('status', { length: 20 }).notNull().default('pending').$type<'pending' | 'confirmed' | 'failed'>(),
  fromAddress: varchar('from_address', { length: 255 }),
  toAddress: varchar('to_address', { length: 255 }),
  blockNumber: integer('block_number'),
  gasUsed: decimal('gas_used', { precision: 20, scale: 0 }),
  gasPrice: decimal('gas_price', { precision: 20, scale: 0 }),
  // New fields for network-based transactions
  network: varchar('network', { length: 20 }), // BTC, ETH, POLYGON, BNB, TRON
  coin: varchar('coin', { length: 20 }), // BTC, ETH, USDT, MATIC, BNB, TRX
  reference: varchar('reference', { length: 255 }), // Merchant reference
  merchantId: varchar('merchant_id', { length: 255 }), // Direct merchant association
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
}));

// Zod schemas for validation
export const insertTransactionSchema = createInsertSchema(transactions, {
  type: z.enum(['send', 'receive', 'request']),
  status: z.enum(['pending', 'confirmed', 'failed']).default('pending'),
  amount: z.string().regex(/^\d+(\.\d{1,8})?$/),
});

export const selectTransactionSchema = createSelectSchema(transactions);

// Type exports
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
