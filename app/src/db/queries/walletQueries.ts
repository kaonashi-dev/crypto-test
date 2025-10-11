import { db } from '../index.js';
import { wallets, type Wallet, type NewWallet } from '../schema/wallets.js';
import { eq, and } from 'drizzle-orm';

export class WalletQueries {
  // Create a new wallet
  static async create(walletData: Omit<NewWallet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Wallet> {
    const [wallet] = await db.insert(wallets)
      .values({
        ...walletData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return wallet;
  }

  // Find all wallets
  static async findAll(): Promise<Wallet[]> {
    return await db.select().from(wallets);
  }

  // Find wallet by ID
  static async findById(id: number): Promise<Wallet | null> {
    const [wallet] = await db.select()
      .from(wallets)
      .where(eq(wallets.id, id))
      .limit(1);
    
    return wallet || null;
  }

  // Find wallets by merchant ID
  static async findByMerchantId(merchantId: number): Promise<Wallet[]> {
    return await db.select()
      .from(wallets)
      .where(eq(wallets.merchantId, merchantId));
  }

  // Find wallet by address
  static async findByAddress(address: string): Promise<Wallet | null> {
    const [wallet] = await db.select()
      .from(wallets)
      .where(eq(wallets.address, address))
      .limit(1);
    
    return wallet || null;
  }

  // Update wallet
  static async update(id: number, updateData: Partial<Omit<NewWallet, 'id' | 'createdAt'>>): Promise<Wallet | null> {
    const [wallet] = await db.update(wallets)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, id))
      .returning();
    
    return wallet || null;
  }

  // Delete wallet
  static async delete(id: number): Promise<boolean> {
    const result = await db.delete(wallets)
      .where(eq(wallets.id, id));
    
    return result.rowCount > 0;
  }

  // Update wallet balance
  static async updateBalance(id: number, balance: string): Promise<Wallet | null> {
    const [wallet] = await db.update(wallets)
      .set({
        balance,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, id))
      .returning();
    
    return wallet || null;
  }

  // Find wallets by network
  static async findByNetwork(network: 'bitcoin' | 'ethereum' | 'polygon'): Promise<Wallet[]> {
    return await db.select()
      .from(wallets)
      .where(eq(wallets.network, network));
  }

  // Find active wallets
  static async findActive(): Promise<Wallet[]> {
    return await db.select()
      .from(wallets)
      .where(eq(wallets.status, 'active'));
  }

  // Find wallets by merchant and network
  static async findByMerchantAndNetwork(merchantId: number, network: 'bitcoin' | 'ethereum' | 'polygon'): Promise<Wallet[]> {
    return await db.select()
      .from(wallets)
      .where(and(
        eq(wallets.merchantId, merchantId),
        eq(wallets.network, network)
      ));
  }
}
