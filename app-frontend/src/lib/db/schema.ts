import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

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

export const usersBackoffice = pgTable('users_backoffice', {
  id: serial('id').primaryKey(),
  merchantId: integer('merchant_id').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Merchant = typeof merchants.$inferSelect;
export type NewMerchant = typeof merchants.$inferInsert;
export type User = typeof usersBackoffice.$inferSelect;
export type NewUser = typeof usersBackoffice.$inferInsert;
