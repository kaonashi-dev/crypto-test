import type { Merchant } from '@/types';

class MerchantModel {
  private merchants: Merchant[] = [];

  constructor() {
    this.initializeTestData();
  }

  private initializeTestData() {
    this.merchants = [
      {
        id: 'merchant-1',
        name: 'Test Merchant 1',
        email: 'merchant1@example.com',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'merchant-2',
        name: 'Test Merchant 2', 
        email: 'merchant2@example.com',
        status: 'active',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ];
  }

  async create(merchantData: Omit<Merchant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Merchant> {
    const merchant: Merchant = {
      id: crypto.randomUUID(),
      ...merchantData,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.merchants.push(merchant);
    return merchant;
  }

  async findAll(): Promise<Merchant[]> {
    return [...this.merchants];
  }

  async findById(id: string): Promise<Merchant | null> {
    return this.merchants.find(merchant => merchant.id === id) || null;
  }

  async findByEmail(email: string): Promise<Merchant | null> {
    return this.merchants.find(merchant => merchant.email === email) || null;
  }

  async update(id: string, updateData: Partial<Omit<Merchant, 'id' | 'createdAt'>>): Promise<Merchant | null> {
    const merchantIndex = this.merchants.findIndex(merchant => merchant.id === id);
    
    if (merchantIndex === -1) {
      return null;
    }

    this.merchants[merchantIndex] = {
      ...this.merchants[merchantIndex],
      ...updateData,
      updatedAt: new Date(),
    };

    return this.merchants[merchantIndex];
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.merchants.length;
    this.merchants = this.merchants.filter(merchant => merchant.id !== id);
    return this.merchants.length < initialLength;
  }
}

export const merchantModel = new MerchantModel();