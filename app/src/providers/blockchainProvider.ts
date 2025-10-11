import type { Transaction } from '@/types';

export interface ProviderTransactionResult {
  success: boolean;
  txHash?: string;
  status?: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  error?: string;
}

export interface ProviderStatusResult {
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  confirmations?: number;
}

export interface TransactionDetails {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  coin: string;
  network: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  blockHash?: string;
  gasUsed?: string;
  gasPrice?: string;
  fee?: string;
  confirmations?: number;
  timestamp?: number;
  explorerUrl?: string;
}

export interface AddressTransactionsResult {
  transactions: TransactionDetails[];
  total: number;
  page: number;
  limit: number;
}

export interface WalletInfo {
  address: string;
  network: 'BTC' | 'ETH' | 'POLYGON' | 'BNB' | 'TRON';
  balance: number;
  coin?: 'BTC' | 'ETH' | 'USDT' | 'MATIC' | 'BNB' | 'TRX';
}

export interface TransactionRequest {
  fromAddress: string;
  toAddress: string;
  amount: string;
  network: 'BTC' | 'ETH' | 'POLYGON' | 'BNB' | 'TRON';
  coin: 'BTC' | 'ETH' | 'USDT' | 'MATIC' | 'BNB' | 'TRX';
  privateKey?: string; // For signing transactions
  gasPrice?: string;
  gasLimit?: string;
  fee?: string; // For Bitcoin
  reference?: string; // Merchant reference
}

export abstract class BlockchainProvider {
  protected network: string;
  protected apiKey?: string;
  protected apiUrl?: string;

  constructor(network: string, apiKey?: string, apiUrl?: string) {
    this.network = network;
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  // Abstract methods that must be implemented by each provider
  abstract sendTransaction(request: TransactionRequest): Promise<ProviderTransactionResult>;
  abstract getTransactionStatus(txHash: string): Promise<ProviderStatusResult>;
  abstract getWalletBalance(address: string, coin?: string): Promise<number>;
  abstract validateAddress(address: string): boolean;
  abstract estimateFee(request: Omit<TransactionRequest, 'privateKey'>): Promise<string>;
  
  // New method for creating wallets
  abstract createWallet(): Promise<{ address: string; privateKey: string; publicKey?: string }>;
  
  // New methods for transaction queries
  abstract getTransactionDetails(txHash: string, coin?: string): Promise<TransactionDetails>;
  abstract getAddressTransactions(address: string, coin?: string, page?: number, limit?: number): Promise<AddressTransactionsResult>;
  
  // Optional methods with default implementations
  generateWallet(): { address: string; privateKey: string } {
    throw new Error('Wallet generation not implemented for this provider');
  }

  getExplorerUrl(txHash: string): string {
    throw new Error('Explorer URL not available for this provider');
  }

  // Common utility methods
  protected isValidAmount(amount: string): boolean {
    const regex = /^\d+(\.\d{1,8})?$/;
    return regex.test(amount) && parseFloat(amount) > 0;
  }

  protected formatAmount(amount: string, decimals: number = 8): string {
    return parseFloat(amount).toFixed(decimals);
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Factory for creating provider instances
export class ProviderFactory {
  static createProvider(network: 'BTC' | 'ETH' | 'POLYGON' | 'BNB' | 'TRON' | string, config?: any): BlockchainProvider {
    // Normalize network name to uppercase and handle variations
    const normalizedNetwork = network.toUpperCase();

    // Map common variations to standard network names
    const networkMap: Record<string, string> = {
      'ETHEREUM': 'ETH',
      'BITCOIN': 'BTC',
    };

    const mappedNetwork = networkMap[normalizedNetwork] || normalizedNetwork;

    switch (mappedNetwork) {
      case 'ETH':
        // Import EthereumProvider dynamically to avoid circular dependency
        const { EthereumProvider } = require('./ethereumProvider');
        return new EthereumProvider(config);
      case 'BTC':
        return new BitcoinProvider(config?.apiKey, config?.apiUrl);
      case 'POLYGON':
        return new PolygonProvider(config?.apiKey, config?.apiUrl);
      case 'BNB':
        return new BNBProvider(config?.apiKey, config?.apiUrl);
      case 'TRON':
        // Import TronProvider dynamically to avoid circular dependency
        const { TronProvider } = require('./tronProvider');
        return new TronProvider(config);
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }
}


// Bitcoin Provider Implementation (placeholder)
export class BitcoinProvider extends BlockchainProvider {
  constructor(apiKey?: string, apiUrl?: string) {
    super('bitcoin', apiKey, apiUrl || 'https://api.blockcypher.com/v1/btc/main/');
  }

  async sendTransaction(request: TransactionRequest): Promise<ProviderTransactionResult> {
    try {
      // TODO: Implement Bitcoin transaction sending
      console.log(`Sending Bitcoin transaction from ${request.fromAddress} to ${request.toAddress}`);
      
      return {
        success: true,
        txHash: Math.random().toString(16).substr(2, 64),
        status: 'pending'
      };
    } catch (error) {
      console.error('Bitcoin transaction error:', error);
      return {
        success: false,
        error: 'Failed to send Bitcoin transaction'
      };
    }
  }

  async getTransactionStatus(txHash: string): Promise<ProviderStatusResult> {
    // TODO: Implement Bitcoin transaction status checking
    return {
      status: 'pending'
    };
  }

  async getWalletBalance(address: string, coin?: string): Promise<number> {
    // TODO: Implement Bitcoin balance checking
    return 0;
  }

  async createWallet(): Promise<{ address: string; privateKey: string; publicKey?: string }> {
    // TODO: Implement Bitcoin wallet creation
    throw new Error('Bitcoin wallet creation not implemented yet');
  }

  validateAddress(address: string): boolean {
    // Simple Bitcoin address validation (legacy and bech32)
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || /^bc1[a-z0-9]{39,59}$/.test(address);
  }

  async estimateFee(request: Omit<TransactionRequest, 'privateKey'>): Promise<string> {
    // TODO: Implement Bitcoin fee estimation
    return '0.0001';
  }

  async getTransactionDetails(txHash: string, coin?: string): Promise<TransactionDetails> {
    // TODO: Implement Bitcoin transaction details
    throw new Error('Bitcoin transaction details not implemented yet');
  }

  async getAddressTransactions(address: string, coin?: string, page: number = 1, limit: number = 10): Promise<AddressTransactionsResult> {
    // TODO: Implement Bitcoin address transactions
    throw new Error('Bitcoin address transactions not implemented yet');
  }

  override getExplorerUrl(txHash: string): string {
    return `https://blockstream.info/tx/${txHash}`;
  }
}

// Polygon Provider Implementation (placeholder)
export class PolygonProvider extends BlockchainProvider {
  constructor(apiKey?: string, apiUrl?: string) {
    super('polygon', apiKey, apiUrl || 'https://polygon-mainnet.infura.io/v3/');
  }

  async sendTransaction(request: TransactionRequest): Promise<ProviderTransactionResult> {
    try {
      // TODO: Implement Polygon transaction sending
      console.log(`Sending Polygon transaction from ${request.fromAddress} to ${request.toAddress}`);
      
      return {
        success: true,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        status: 'pending'
      };
    } catch (error) {
      console.error('Polygon transaction error:', error);
      return {
        success: false,
        error: 'Failed to send Polygon transaction'
      };
    }
  }

  async getTransactionStatus(txHash: string): Promise<ProviderStatusResult> {
    // TODO: Implement Polygon transaction status checking
    return {
      status: 'pending'
    };
  }

  async getWalletBalance(address: string, coin?: string): Promise<number> {
    // TODO: Implement Polygon balance checking
    return 0;
  }

  async createWallet(): Promise<{ address: string; privateKey: string; publicKey?: string }> {
    // TODO: Implement Polygon wallet creation
    throw new Error('Polygon wallet creation not implemented yet');
  }

  validateAddress(address: string): boolean {
    // Polygon uses Ethereum-style addresses
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  async estimateFee(request: Omit<TransactionRequest, 'privateKey'>): Promise<string> {
    // TODO: Implement Polygon gas fee estimation
    return '0.001';
  }

  async getTransactionDetails(txHash: string, coin?: string): Promise<TransactionDetails> {
    // TODO: Implement Polygon transaction details
    throw new Error('Polygon transaction details not implemented yet');
  }

  async getAddressTransactions(address: string, coin?: string, page: number = 1, limit: number = 10): Promise<AddressTransactionsResult> {
    // TODO: Implement Polygon address transactions
    throw new Error('Polygon address transactions not implemented yet');
  }

  override getExplorerUrl(txHash: string): string {
    return `https://polygonscan.com/tx/${txHash}`;
  }
}

// BNB Provider Implementation (placeholder)
export class BNBProvider extends BlockchainProvider {
  constructor(apiKey?: string, apiUrl?: string) {
    super('BNB', apiKey, apiUrl || 'https://bsc-dataseed1.binance.org/');
  }

  async sendTransaction(request: TransactionRequest): Promise<ProviderTransactionResult> {
    try {
      // TODO: Implement BNB transaction sending
      console.log(`Sending BNB transaction from ${request.fromAddress} to ${request.toAddress}`);
      
      return {
        success: true,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        status: 'pending'
      };
    } catch (error) {
      console.error('BNB transaction error:', error);
      return {
        success: false,
        error: 'Failed to send BNB transaction'
      };
    }
  }

  async getTransactionStatus(txHash: string): Promise<ProviderStatusResult> {
    // TODO: Implement BNB transaction status checking
    return {
      status: 'pending'
    };
  }

  async getWalletBalance(address: string, coin?: string): Promise<number> {
    // TODO: Implement BNB balance checking
    return 0;
  }

  async createWallet(): Promise<{ address: string; privateKey: string; publicKey?: string }> {
    // TODO: Implement BNB wallet creation
    throw new Error('BNB wallet creation not implemented yet');
  }

  validateAddress(address: string): boolean {
    // BNB uses Ethereum-style addresses
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  async estimateFee(request: Omit<TransactionRequest, 'privateKey'>): Promise<string> {
    // TODO: Implement BNB gas fee estimation
    return '0.001';
  }

  async getTransactionDetails(txHash: string, coin?: string): Promise<TransactionDetails> {
    // TODO: Implement BNB transaction details
    throw new Error('BNB transaction details not implemented yet');
  }

  async getAddressTransactions(address: string, coin?: string, page: number = 1, limit: number = 10): Promise<AddressTransactionsResult> {
    // TODO: Implement BNB address transactions
    throw new Error('BNB address transactions not implemented yet');
  }

  override getExplorerUrl(txHash: string): string {
    return `https://bscscan.com/tx/${txHash}`;
  }
}
