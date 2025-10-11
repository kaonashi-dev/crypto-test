import { db } from '../index.js';
import { merchants, type Merchant, type NewMerchant } from '../schema/merchants.js';
import { eq, and } from 'drizzle-orm';

export class MerchantQueries {
  // Create a new merchant
  static async create(merchantData: Omit<NewMerchant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Merchant> {
    const [merchant] = await db.insert(merchants)
      .values({
        ...merchantData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return merchant;
  }

  // Find all merchants
  static async findAll(): Promise<Merchant[]> {
    return await db.select().from(merchants);
  }

  // Find merchant by ID
  static async findById(id: number): Promise<Merchant | null> {
    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.id, id))
      .limit(1);
    
    return merchant || null;
  }

  // Find merchant by email
  static async findByEmail(email: string): Promise<Merchant | null> {
    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.email, email))
      .limit(1);
    
    return merchant || null;
  }

  // Find merchant by merchantId (nanoid)
  static async findByMerchantId(merchantId: string): Promise<Merchant | null> {
    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.merchantId, merchantId))
      .limit(1);
    
    return merchant || null;
  }


  // Update merchant
  static async update(id: number, updateData: Partial<Omit<NewMerchant, 'id' | 'createdAt'>>): Promise<Merchant | null> {
    const [merchant] = await db.update(merchants)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, id))
      .returning();
    
    return merchant || null;
  }

  // Delete merchant
  static async delete(id: number): Promise<boolean> {
    const result = await db.delete(merchants)
      .where(eq(merchants.id, id));
    
    return result.rowCount > 0;
  }

  // Find active merchants
  static async findActive(): Promise<Merchant[]> {
    return await db.select()
      .from(merchants)
      .where(eq(merchants.status, 'active'));
  }

  // Update merchant status
  static async updateStatus(id: number, status: 'active' | 'inactive'): Promise<Merchant | null> {
    const [merchant] = await db.update(merchants)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, id))
      .returning();
    
    return merchant || null;
  }
}
