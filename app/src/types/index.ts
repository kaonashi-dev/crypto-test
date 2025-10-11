export interface Merchant {
  id: number;
  merchantId: string; // nanoid
  name: string;
  email: string;
  merchantSecret: string; // hashed
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMerchantRequest {
  name: string;
  email: string;
}

export interface Wallet {
  id: string;
  merchantId: string;
  address: string;
  network: 'bitcoin' | 'ethereum' | 'polygon';
  balance: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWalletRequest {
  merchantId: string;
  network: 'bitcoin' | 'ethereum' | 'polygon';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthRequest {
  merchantId: string;
  merchantSecret: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
}

export interface JWTPayload {
  merchantId: string;
  iat?: number;
  exp?: number;
}

// Import the Transaction type from the database schema
import type { Transaction as DbTransaction } from '@/db/schema/transactions';

export type Transaction = DbTransaction;

export interface CreateTransactionRequest {
  // New fields
  reference?: string; // Merchant reference
  amount: string;
  type: 'send' | 'receive' | 'request';
  toAddress?: string; // Required for 'send' transactions
  fromAddress?: string; // Required for 'receive' transactions (for tracking external deposits)
  network: 'BTC' | 'ETH' | 'POLYGON' | 'BNB' | 'TRON';
  coin: 'BTC' | 'ETH' | 'USDT' | 'MATIC' | 'BNB' | 'TRX';
  
  // Legacy field for backward compatibility
  walletId?: string;
}

export interface CreateRequestTransactionRequest {
  reference?: string; // Merchant reference
  amount: string;
  network: 'BTC' | 'ETH' | 'POLYGON' | 'BNB' | 'TRON';
  coin: 'BTC' | 'ETH' | 'USDT' | 'MATIC' | 'BNB' | 'TRX';
}

// Currency and Network types
export interface Network {
  id: number;
  name: string;
  displayName: string;
  symbol: string;
  chainId?: number;
  rpcUrl?: string;
  explorerUrl?: string;
  isTestnet: boolean;
  isActive: boolean;
  minConfirmations: number;
  avgBlockTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Currency {
  id: number;
  networkId: number;
  name: string;
  symbol: string;
  decimals: number;
  contractAddress?: string;
  tokenStandard?: string;
  isNative: boolean;
  isStablecoin: boolean;
  minTransactionAmount: string;
  maxTransactionAmount?: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeRate {
  id: number;
  currencyId: number;
  baseCurrency: string;
  rate: string;
  source: string;
  lastUpdated: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface CurrencyWithRate {
  id: number;
  name: string;
  symbol: string;
  decimals: number;
  contractAddress?: string;
  tokenStandard?: string;
  isNative: boolean;
  isStablecoin: boolean;
  minTransactionAmount: string;
  maxTransactionAmount?: string;
  logoUrl?: string;
  description?: string;
  exchangeRate?: {
    rate: string;
    baseCurrency: string;
    lastUpdated: Date;
    source: string;
  };
}

export interface NetworkWithCurrencies {
  id: number;
  name: string;
  displayName: string;
  symbol: string;
  chainId?: number;
  rpcUrl?: string;
  explorerUrl?: string;
  isTestnet: boolean;
  isActive: boolean;
  minConfirmations: number;
  avgBlockTime: number;
  currencies: CurrencyWithRate[];
}

export interface ConversionRequest {
  amount: string;
  fromCurrencyId: number;
  toCurrencyId: number;
}

export interface ConversionResult {
  originalAmount: string;
  convertedAmount: string;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: string;
  lastUpdated: Date;
}

export interface ExchangeRateUpdate {
  currencyId: number;
  rate: string;
  baseCurrency?: string;
  source: string;
}