export interface BaseWallet {
  address: string;
  privateKey: string;
}

export interface EthereumWallet extends BaseWallet {
  publicKey?: string;
}

export interface TronWallet extends BaseWallet {
  publicKey: string;
  address: string; // Override: base58 format for Tron
  hexAddress: string;
}

export interface WalletBalance {
  success: boolean;
  balance?: string;
  balanceRaw?: string;
  decimals?: number;
  address?: string;
  network?: string;
  error?: string;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  txID?: string;
  amount?: number;
  amountRaw?: string;
  decimals?: number;
  network?: string;
  error?: string;
  transaction?: any;
  receipt?: any;
}

export interface TransactionStatus {
  txHash?: string;
  txID?: string;
  confirmed: boolean;
  blockNumber?: number | bigint;
  gasUsed?: string;
  energyUsed?: number;
  netUsed?: number;
  status?: number;
  error?: string;
  network?: string;
}
