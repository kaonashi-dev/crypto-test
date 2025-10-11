import type { Wallet } from '@/types';

class WalletModel {
  private wallets: Wallet[] = [];

  async create(walletData: Omit<Wallet, 'id' | 'address' | 'balance' | 'createdAt' | 'updatedAt'>): Promise<Wallet> {
    const wallet: Wallet = {
      id: crypto.randomUUID(),
      address: this.generateAddress(walletData.network),
      balance: 0,
      ...walletData,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.wallets.push(wallet);
    return wallet;
  }

  async findAll(): Promise<Wallet[]> {
    return [...this.wallets];
  }

  async findById(id: string): Promise<Wallet | null> {
    return this.wallets.find(wallet => wallet.id === id) || null;
  }

  async findByMerchantId(merchantId: string): Promise<Wallet[]> {
    return this.wallets.filter(wallet => wallet.merchantId === merchantId);
  }

  async findByAddress(address: string): Promise<Wallet | null> {
    return this.wallets.find(wallet => wallet.address === address) || null;
  }

  async update(id: string, updateData: Partial<Omit<Wallet, 'id' | 'createdAt'>>): Promise<Wallet | null> {
    const walletIndex = this.wallets.findIndex(wallet => wallet.id === id);
    
    if (walletIndex === -1) {
      return null;
    }

    this.wallets[walletIndex] = {
      ...this.wallets[walletIndex],
      ...updateData,
      updatedAt: new Date(),
    };

    return this.wallets[walletIndex];
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.wallets.length;
    this.wallets = this.wallets.filter(wallet => wallet.id !== id);
    return this.wallets.length < initialLength;
  }

  private generateAddress(network: string): string {
    const prefixes = {
      bitcoin: '1',
      ethereum: '0x',
      polygon: '0x'
    };

    const prefix = prefixes[network as keyof typeof prefixes] || '0x';
    const randomHex = crypto.randomUUID().replace(/-/g, '');
    
    if (network === 'bitcoin') {
      return prefix + randomHex.substring(0, 33);
    }
    
    return prefix + randomHex.substring(0, 40);
  }
}

export const walletModel = new WalletModel();