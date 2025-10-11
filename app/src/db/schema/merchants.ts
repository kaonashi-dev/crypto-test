import { pgTable, serial, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { wallets } from './wallets';

export const merchants = pgTable('merchants', {
  id: serial('id').primaryKey(),
  merchantId: varchar('merchant_id', { length: 21 }).notNull().unique(), // nanoid format
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  merchantSecret: text('merchant_secret').notNull(), // hashed secret
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Zod schemas for validation
export const insertMerchantSchema = createInsertSchema(merchants, {
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const selectMerchantSchema = createSelectSchema(merchants);

// Relations
export const merchantsRelations = relations(merchants, ({ many }) => ({
  wallets: many(wallets),
}));

// Type exports
export type Merchant = typeof merchants.$inferSelect;
export type NewMerchant = typeof merchants.$inferInsert;
