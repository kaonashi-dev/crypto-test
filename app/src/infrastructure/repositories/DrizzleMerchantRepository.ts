import { eq } from 'drizzle-orm';
import { AsyncResult, Result } from '../../domain/shared/Result';
import { MerchantRepository } from '../../domain/repositories/MerchantRepository';
import { Merchant, MerchantStatus } from '../../domain/entities/Merchant';
import { db } from '../../db';
import { merchants } from '../../db/schema/merchants';

export class DrizzleMerchantRepository implements MerchantRepository {
  async findById(id: string): AsyncResult<Merchant | null> {
    try {
      const result = await db
        .select()
        .from(merchants)
        .where(eq(merchants.merchantId, id))
        .limit(1);

      if (result.length === 0) {
        return Result.success(null);
      }

      const merchant = this.toDomainEntity(result[0]);
      return Result.success(merchant);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findByApiKey(apiKey: string): AsyncResult<Merchant | null> {
    try {
      const result = await db
        .select()
        .from(merchants)
        .where(eq(merchants.merchantId, apiKey))
        .limit(1);

      if (result.length === 0) {
        return Result.success(null);
      }

      const merchant = this.toDomainEntity(result[0]);
      return Result.success(merchant);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findByEmail(email: string): AsyncResult<Merchant | null> {
    try {
      const result = await db
        .select()
        .from(merchants)
        .where(eq(merchants.email, email))
        .limit(1);

      if (result.length === 0) {
        return Result.success(null);
      }

      const merchant = this.toDomainEntity(result[0]);
      return Result.success(merchant);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async save(merchant: Merchant): AsyncResult<void> {
    try {
      const snapshot = merchant.toSnapshot();
      const persistenceData = this.toPersistenceModel(snapshot);

      const existing = await db
        .select()
        .from(merchants)
        .where(eq(merchants.merchantId, snapshot.id))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(merchants).values(persistenceData);
      } else {
        await db
          .update(merchants)
          .set({
            name: persistenceData.name,
            email: persistenceData.email,
            status: persistenceData.status,
            updatedAt: persistenceData.updatedAt,
          })
          .where(eq(merchants.merchantId, snapshot.id));
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async delete(id: string): AsyncResult<void> {
    try {
      await db.delete(merchants).where(eq(merchants.merchantId, id));
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findAll(): AsyncResult<Merchant[]> {
    try {
      const result = await db.select().from(merchants);
      const domainMerchants = result.map(row => this.toDomainEntity(row));
      return Result.success(domainMerchants);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  private toDomainEntity(row: any): Merchant {
    return Merchant.fromPersistence({
      id: row.merchantId,
      name: row.name,
      email: row.email,
      apiKey: row.merchantId, // Using merchantId as API key
      secretKey: row.merchantSecret,
      status: row.status as MerchantStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toPersistenceModel(merchant: any) {
    return {
      merchantId: merchant.id,
      name: merchant.name,
      email: merchant.email,
      merchantSecret: merchant.secretKey,
      status: merchant.status,
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt,
    };
  }
}