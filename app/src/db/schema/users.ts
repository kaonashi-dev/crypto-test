import { pgTable, serial, varchar, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { merchants } from './merchants';

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

// Relations
export const usersBackofficeRelations = relations(usersBackoffice, ({ one }) => ({
  merchant: one(merchants, {
    fields: [usersBackoffice.merchantId],
    references: [merchants.id],
  }),
}));

export type UserBackoffice = typeof usersBackoffice.$inferSelect;
export type NewUserBackoffice = typeof usersBackoffice.$inferInsert;