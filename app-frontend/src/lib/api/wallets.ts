import type { Wallet } from '$lib/types';
import { AuthService } from './auth';

const API_BASE_URL = 'http://localhost:3000'; // Base URL for the API

export class WalletService {
  private static getAuthHeaders() {
    const token = AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  static async getWallets(): Promise<Wallet[]> {
    const response = await fetch(`${API_BASE_URL}/merchant/wallets`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch wallets');
    }

    const data = await response.json();
    return data.data || [];
  }


  static async createWallet(network: string, coin: string): Promise<Wallet> {
    const response = await fetch(`${API_BASE_URL}/merchant/wallet`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ network, coin }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create wallet');
    }

    const data = await response.json();
    return data.data;
  }

  static async getOrCreateWallet(network: string, coin: string): Promise<Wallet> {
    // This endpoint gets or creates a wallet for the specified network/coin combination
    const response = await fetch(`${API_BASE_URL}/merchant/wallet`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ network, coin }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get or create wallet');
    }

    const data = await response.json();
    return data.data;
  }
}
