import { eq, and } from 'drizzle-orm';
import { AsyncResult, Result } from '../../domain/shared/Result';
import { WalletRepository } from '../../domain/repositories/WalletRepository';
import { Wallet, WalletStatus } from '../../domain/entities/Wallet';
import { Address } from '../../domain/value-objects/Address';
import { Network } from '../../domain/value-objects/Network';
import { Money } from '../../domain/value-objects/Money';
import { db } from '../../db';
import { wallets } from '../../db/schema/wallets';
import { merchants } from '../../db/schema/merchants';

export class DrizzleWalletRepository implements WalletRepository {
  async findById(id: string): AsyncResult<Wallet | null> {
    try {
      const result = await db
        .select({
          wallet: wallets,
          merchant: merchants,
        })
        .from(wallets)
        .leftJoin(merchants, eq(wallets.merchantId, merchants.id))
        .where(eq(wallets.id, parseInt(id)))
        .limit(1);

      if (result.length === 0) {
        return Result.success(null);
      }

      const walletResult = await this.toDomainEntity(result[0]);
      if (walletResult.isFailure) {
        return Result.failure(walletResult.error);
      }

      return Result.success(walletResult.value);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findByMerchantId(merchantId: string): AsyncResult<Wallet[]> {
    try {
      const result = await db
        .select({
          wallet: wallets,
          merchant: merchants,
        })
        .from(wallets)
        .leftJoin(merchants, eq(wallets.merchantId, merchants.id))
        .where(eq(merchants.merchantId, merchantId));

      const domainWallets: Wallet[] = [];
      for (const row of result) {
        const walletResult = await this.toDomainEntity(row);
        if (walletResult.isSuccess) {
          domainWallets.push(walletResult.value);
        }
      }

      return Result.success(domainWallets);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findByAddress(address: Address): AsyncResult<Wallet | null> {
    try {
      const result = await db
        .select({
          wallet: wallets,
          merchant: merchants,
        })
        .from(wallets)
        .leftJoin(merchants, eq(wallets.merchantId, merchants.id))
        .where(eq(wallets.address, address.value))
        .limit(1);

      if (result.length === 0) {
        return Result.success(null);
      }

      const walletResult = await this.toDomainEntity(result[0]);
      if (walletResult.isFailure) {
        return Result.failure(walletResult.error);
      }

      return Result.success(walletResult.value);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findByMerchantIdAndNetwork(merchantId: string, network: Network): AsyncResult<Wallet[]> {
    try {
      const result = await db
        .select({
          wallet: wallets,
          merchant: merchants,
        })
        .from(wallets)
        .leftJoin(merchants, eq(wallets.merchantId, merchants.id))
        .where(
          and(
            eq(merchants.merchantId, merchantId),
            eq(wallets.network, network.value.toUpperCase())
          )
        );

      const domainWallets: Wallet[] = [];
      for (const row of result) {
        const walletResult = await this.toDomainEntity(row);
        if (walletResult.isSuccess) {
          domainWallets.push(walletResult.value);
        }
      }

      return Result.success(domainWallets);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async save(wallet: Wallet): AsyncResult<void> {
    try {
      const snapshot = wallet.toSnapshot();
      
      const merchantResult = await db
        .select()
        .from(merchants)
        .where(eq(merchants.merchantId, snapshot.merchantId))
        .limit(1);

      if (merchantResult.length === 0) {
        return Result.failure(new Error('Merchant not found'));
      }

      const persistenceData = this.toPersistenceModel(snapshot, merchantResult[0].id);

      const existing = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, parseInt(snapshot.id)))
        .limit(1);

      if (existing.length === 0) {
        const inserted = await db.insert(wallets).values({
          ...persistenceData,
          id: undefined, // Let DB generate ID
        }).returning();
        
        // Update the domain entity with the generated ID
        if (inserted.length > 0) {
          (wallet as any).props.id = inserted[0].id.toString();
        }
      } else {
        await db
          .update(wallets)
          .set({
            balance: persistenceData.balance,
            status: persistenceData.status,
            updatedAt: persistenceData.updatedAt,
          })
          .where(eq(wallets.id, parseInt(snapshot.id)));
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async delete(id: string): AsyncResult<void> {
    try {
      await db.delete(wallets).where(eq(wallets.id, parseInt(id)));
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async exists(id: string): AsyncResult<boolean> {
    try {
      const result = await db
        .select({ id: wallets.id })
        .from(wallets)
        .where(eq(wallets.id, parseInt(id)))
        .limit(1);

      return Result.success(result.length > 0);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  private async toDomainEntity(row: any): AsyncResult<Wallet> {
    try {
      const networkResult = Network.create(row.wallet.network.toLowerCase());
      if (networkResult.isFailure) {
        return Result.failure(networkResult.error);
      }

      const addressResult = Address.create(row.wallet.address, networkResult.value);
      if (addressResult.isFailure) {
        return Result.failure(addressResult.error);
      }

      const balanceResult = Money.create(
        parseFloat(row.wallet.balance),
        row.wallet.coin
      );
      if (balanceResult.isFailure) {
        return Result.failure(balanceResult.error);
      }

      const wallet = Wallet.fromPersistence({
        id: row.wallet.id.toString(),
        merchantId: row.merchant.merchantId,
        address: addressResult.value,
        network: networkResult.value,
        balance: balanceResult.value,
        status: row.wallet.status as WalletStatus,
        createdAt: row.wallet.createdAt,
        updatedAt: row.wallet.updatedAt,
      });

      return Result.success(wallet);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  private toPersistenceModel(wallet: any, merchantDbId: number) {
    return {
      id: wallet.id ? parseInt(wallet.id) : undefined,
      merchantId: merchantDbId,
      address: wallet.address.value,
      network: wallet.network.value.toUpperCase(),
      coin: wallet.balance.currency,
      balance: wallet.balance.amount.toString(),
      status: wallet.status,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}