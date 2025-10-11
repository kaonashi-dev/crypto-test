import type { Transaction } from '$lib/types';
import { AuthService } from './auth';

const API_BASE_URL = 'http://localhost:3000';

export class TransactionService {
  private static getAuthHeaders() {
    const token = AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Check if backend service is running
  static async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  // Get all transactions for a specific wallet
  static async getTransactionsByWallet(walletId: string): Promise<Transaction[]> {
    const response = await fetch(`${API_BASE_URL}/transaction/wallet/${walletId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch transactions');
    }

    const data = await response.json();
    
    // Map the API response to match our Transaction interface
    if (data.data && data.data.transactions) {
      console.log('API Response data:', data.data);
      console.log('Wallet info:', data.data.walletInfo);
      
      return data.data.transactions.map((tx: any, index: number) => {
        const walletAddress = data.data.walletInfo.address;
        const isFromWallet = tx.fromAddress === walletAddress;
        const transactionType = isFromWallet ? 'send' : 'receive';
        
        console.log(`Transaction ${tx.txHash}: from=${tx.fromAddress}, to=${tx.toAddress}, wallet=${walletAddress}, type=${transactionType}`);
        console.log(`Amount: ${tx.amount} ${tx.coin}, Status: ${tx.status}, Network: ${tx.network}`);
        
        return {
          id: index + 1, // Generate sequential ID since API doesn't provide numeric id
          walletId: parseInt(walletId),
          txHash: tx.txHash,
          amount: tx.amount,
          type: transactionType,
          status: tx.status,
          fromAddress: tx.fromAddress,
          toAddress: tx.toAddress,
          blockNumber: null,
          gasUsed: null,
          gasPrice: null,
          network: tx.network,
          coin: tx.coin,
          reference: null,
          merchantId: null,
          createdAt: new Date(tx.timestamp).toISOString(),
          updatedAt: new Date(tx.timestamp).toISOString(),
        };
      });
    }
    
    return [];
  }

  // Get transaction by hash
  static async getTransactionByHash(txHash: string): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transaction/${txHash}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch transaction');
    }

    const data = await response.json();
    return data.data;
  }

  // Create a new transaction
  static async createTransaction(transactionData: {
    amount: string;
    type: 'send' | 'receive' | 'request';
    network: string;
    coin: string;
    toAddress?: string;
    fromAddress?: string;
    reference?: string;
    walletId?: string;
  }): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transaction/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Provide more specific error messages
      if (errorData.error === 'Invalid destination address') {
        throw new Error(`Invalid destination address for ${transactionData.network} network. Please check the address format.`);
      }
      
      if (errorData.error === 'Invalid private key provided') {
        throw new Error('Backend service error: Invalid private key provided. Please ensure the backend service is running and properly configured.');
      }
      
      if (errorData.error && errorData.error.includes('private key')) {
        throw new Error('Backend service error: Private key validation failed. Please ensure the backend service is running and properly configured.');
      }
      
      throw new Error(errorData.error || 'Failed to create transaction');
    }

    const data = await response.json();
    return data.data;
  }

  // Create a request transaction (for receiving funds)
  static async createRequestTransaction(transactionData: {
    amount: string;
    network: string;
    coin: string;
    reference?: string;
  }): Promise<{ transaction: Transaction; wallet: any }> {
    const response = await fetch(`${API_BASE_URL}/transaction/request`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create request transaction');
    }

    const data = await response.json();
    return data.data;
  }

  // Get transaction details from blockchain
  static async getTransactionDetails(txHash: string, network: string, coin?: string): Promise<any> {
    const params = new URLSearchParams({ network });
    if (coin) params.append('coin', coin);
    
    const response = await fetch(`${API_BASE_URL}/transaction/details/${txHash}?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch transaction details');
    }

    const data = await response.json();
    return data.data;
  }

  // Get transactions for an address from blockchain
  static async getTransactionsByAddress(address: string, network: string, coin?: string, page = 1, limit = 10): Promise<any> {
    const params = new URLSearchParams({ 
      network,
      page: page.toString(),
      limit: limit.toString()
    });
    if (coin) params.append('coin', coin);
    
    const response = await fetch(`${API_BASE_URL}/transaction/address/${address}?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch address transactions');
    }

    const data = await response.json();
    return data.data;
  }

  // Create a transfer between wallets
  static async createTransfer(transferData: {
    amount: string;
    type: 'transfer';
    network: string;
    coin: string;
    fromWalletId: string;
    toWalletId: string;
    toAddress: string;
    reference?: string;
  }): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transaction/transfer`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(transferData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Provide more specific error messages
      if (errorData.error === 'Invalid destination address') {
        throw new Error(`Invalid destination address for ${transferData.network} network. Please check the address format.`);
      }
      
      throw new Error(errorData.error || 'Failed to create transfer');
    }

    const data = await response.json();
    return data.data;
  }
}
