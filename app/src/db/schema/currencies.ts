import { pgTable, serial, varchar, timestamp, decimal, boolean, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Networks table - defines supported blockchain networks
export const networks = pgTable('networks', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // e.g., 'ethereum', 'bitcoin', 'polygon'
  displayName: varchar('display_name', { length: 100 }).notNull(), // e.g., 'Ethereum', 'Bitcoin', 'Polygon'
  symbol: varchar('symbol', { length: 10 }).notNull(), // e.g., 'ETH', 'BTC', 'MATIC'
  chainId: integer('chain_id'), // For EVM networks
  rpcUrl: text('rpc_url'), // Default RPC URL
  explorerUrl: text('explorer_url'), // Block explorer URL
  isTestnet: boolean('is_testnet').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  minConfirmations: integer('min_confirmations').notNull().default(1),
  avgBlockTime: integer('avg_block_time_seconds').notNull().default(15), // Average block time in seconds
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Currencies table - defines supported cryptocurrencies and tokens
export const currencies = pgTable('currencies', {
  id: serial('id').primaryKey(),
  networkId: integer('network_id').notNull().references(() => networks.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(), // e.g., 'Bitcoin', 'Ethereum', 'Tether USD'
  symbol: varchar('symbol', { length: 20 }).notNull(), // e.g., 'BTC', 'ETH', 'USDT'
  decimals: integer('decimals').notNull().default(18), // Number of decimal places
  contractAddress: text('contract_address'), // For tokens (null for native currencies)
  tokenStandard: varchar('token_standard', { length: 20 }), // e.g., 'ERC-20', 'BEP-20'
  isNative: boolean('is_native').notNull().default(false), // True if it's the network's native currency
  isStablecoin: boolean('is_stablecoin').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  minTransactionAmount: decimal('min_transaction_amount', { precision: 30, scale: 18 }).notNull().default('0'),
  maxTransactionAmount: decimal('max_transaction_amount', { precision: 30, scale: 18 }), // null = no limit
  logoUrl: text('logo_url'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Exchange rates table - stores current and historical exchange rates
export const exchangeRates = pgTable('exchange_rates', {
  id: serial('id').primaryKey(),
  currencyId: integer('currency_id').notNull().references(() => currencies.id, { onDelete: 'cascade' }),
  baseCurrency: varchar('base_currency', { length: 10 }).notNull().default('USD'), // Base currency for conversion
  rate: decimal('rate', { precision: 20, scale: 8 }).notNull(), // Exchange rate
  source: varchar('source', { length: 50 }).notNull(), // API source (e.g., 'coingecko', 'coinmarketcap')
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const networksRelations = relations(networks, ({ many }) => ({
  currencies: many(currencies),
}));

export const currenciesRelations = relations(currencies, ({ one, many }) => ({
  network: one(networks, {
    fields: [currencies.networkId],
    references: [networks.id],
  }),
  exchangeRates: many(exchangeRates),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  currency: one(currencies, {
    fields: [exchangeRates.currencyId],
    references: [currencies.id],
  }),
}));

// Zod schemas for validation
export const insertNetworkSchema = createInsertSchema(networks, {
  name: z.string().min(1).max(50).toLowerCase(),
  displayName: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10).toUpperCase(),
  chainId: z.number().int().positive().optional(),
  rpcUrl: z.string().url().optional(),
  explorerUrl: z.string().url().optional(),
  minConfirmations: z.number().int().min(1).default(1),
  avgBlockTime: z.number().int().min(1).default(15),
});

export const insertCurrencySchema = createInsertSchema(currencies, {
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(20).toUpperCase(),
  decimals: z.number().int().min(0).max(18).default(18),
  contractAddress: z.string().optional(),
  tokenStandard: z.string().max(20).optional(),
  minTransactionAmount: z.string().regex(/^\d+(\.\d{1,18})?$/).default('0'),
  maxTransactionAmount: z.string().regex(/^\d+(\.\d{1,18})?$/).optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().optional(),
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates, {
  baseCurrency: z.string().length(3).toUpperCase().default('USD'),
  rate: z.string().regex(/^\d+(\.\d{1,8})?$/),
  source: z.string().min(1).max(50),
});

export const selectNetworkSchema = createSelectSchema(networks);
export const selectCurrencySchema = createSelectSchema(currencies);
export const selectExchangeRateSchema = createSelectSchema(exchangeRates);

// Type exports
export type Network = typeof networks.$inferSelect;
export type NewNetwork = typeof networks.$inferInsert;
export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type NewExchangeRate = typeof exchangeRates.$inferInsert;