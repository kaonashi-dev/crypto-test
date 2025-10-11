import { eq, and } from 'drizzle-orm';
import { AsyncResult, Result } from '../../domain/shared/Result';
import { TransactionRepository } from '../../domain/repositories/TransactionRepository';
import { Transaction, TransactionStatus, TransactionType } from '../../domain/entities/Transaction';
import { Address } from '../../domain/value-objects/Address';
import { Network } from '../../domain/value-objects/Network';
import { Money } from '../../domain/value-objects/Money';
import { db } from '../../db';
import { transactions } from '../../db/schema/transactions';
import { wallets } from '../../db/schema/wallets';

export class DrizzleTransactionRepository implements TransactionRepository {
  async findById(id: string): AsyncResult<Transaction | null> {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, parseInt(id)))
        .limit(1);

      if (result.length === 0) {
        return Result.success(null);
      }

      const transactionResult = await this.toDomainEntity(result[0]);
      if (transactionResult.isFailure) {
        return Result.failure(transactionResult.error);
      }

      return Result.success(transactionResult.value);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findByTxHash(txHash: string): AsyncResult<Transaction | null> {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(eq(transactions.txHash, txHash))
        .limit(1);

      if (result.length === 0) {
        return Result.success(null);
      }

      const transactionResult = await this.toDomainEntity(result[0]);
      if (transactionResult.isFailure) {
        return Result.failure(transactionResult.error);
      }

      return Result.success(transactionResult.value);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findByWalletId(walletId: string): AsyncResult<Transaction[]> {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(eq(transactions.walletId, parseInt(walletId)));

      const domainTransactions: Transaction[] = [];
      for (const row of result) {
        const transactionResult = await this.toDomainEntity(row);
        if (transactionResult.isSuccess) {
          domainTransactions.push(transactionResult.value);
        }
      }

      return Result.success(domainTransactions);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findByWalletIdAndType(walletId: string, type: TransactionType): AsyncResult<Transaction[]> {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.walletId, parseInt(walletId)),
            eq(transactions.type, type)
          )
        );

      const domainTransactions: Transaction[] = [];
      for (const row of result) {
        const transactionResult = await this.toDomainEntity(row);
        if (transactionResult.isSuccess) {
          domainTransactions.push(transactionResult.value);
        }
      }

      return Result.success(domainTransactions);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findByWalletIdAndStatus(walletId: string, status: TransactionStatus): AsyncResult<Transaction[]> {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.walletId, parseInt(walletId)),
            eq(transactions.status, status)
          )
        );

      const domainTransactions: Transaction[] = [];
      for (const row of result) {
        const transactionResult = await this.toDomainEntity(row);
        if (transactionResult.isSuccess) {
          domainTransactions.push(transactionResult.value);
        }
      }

      return Result.success(domainTransactions);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findByAddress(address: Address): AsyncResult<Transaction[]> {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(
          eq(transactions.fromAddress, address.value)
        );

      const domainTransactions: Transaction[] = [];
      for (const row of result) {
        const transactionResult = await this.toDomainEntity(row);
        if (transactionResult.isSuccess) {
          domainTransactions.push(transactionResult.value);
        }
      }

      return Result.success(domainTransactions);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findPendingTransactions(): AsyncResult<Transaction[]> {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(eq(transactions.status, 'pending'));

      const domainTransactions: Transaction[] = [];
      for (const row of result) {
        const transactionResult = await this.toDomainEntity(row);
        if (transactionResult.isSuccess) {
          domainTransactions.push(transactionResult.value);
        }
      }

      return Result.success(domainTransactions);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async save(transaction: Transaction): AsyncResult<void> {
    try {
      const snapshot = transaction.toSnapshot();
      const persistenceData = this.toPersistenceModel(snapshot);

      const existing = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, parseInt(snapshot.id)))
        .limit(1);

      if (existing.length === 0) {
        const inserted = await db.insert(transactions).values({
          ...persistenceData,
          id: undefined, // Let DB generate ID
        }).returning();

        // Update the domain entity with the generated ID
        if (inserted.length > 0) {
          (transaction as any).props.id = inserted[0].id.toString();
        }
      } else {
        await db
          .update(transactions)
          .set({
            status: persistenceData.status,
            txHash: persistenceData.txHash,
            blockNumber: persistenceData.blockNumber,
            gasUsed: persistenceData.gasUsed,
            gasPrice: persistenceData.gasPrice,
            updatedAt: persistenceData.updatedAt,
          })
          .where(eq(transactions.id, parseInt(snapshot.id)));
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async delete(id: string): AsyncResult<void> {
    try {
      await db.delete(transactions).where(eq(transactions.id, parseInt(id)));
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async updateStatus(id: string, status: TransactionStatus): AsyncResult<void> {
    try {
      await db
        .update(transactions)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, parseInt(id)));

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  private async toDomainEntity(row: any): AsyncResult<Transaction> {
    try {
      const networkResult = Network.create(row.network?.toLowerCase() || 'ethereum');
      if (networkResult.isFailure) {
        return Result.failure(networkResult.error);
      }

      const fromAddressResult = Address.create(row.fromAddress, networkResult.value);
      if (fromAddressResult.isFailure) {
        return Result.failure(fromAddressResult.error);
      }

      const toAddressResult = Address.create(row.toAddress, networkResult.value);
      if (toAddressResult.isFailure) {
        return Result.failure(toAddressResult.error);
      }

      const amountResult = Money.create(
        parseFloat(row.amount),
        row.coin || networkResult.value.value.toUpperCase()
      );
      if (amountResult.isFailure) {
        return Result.failure(amountResult.error);
      }

      let feeResult: Money | undefined;
      if (row.gasUsed && row.gasPrice) {
        const feeAmount = parseFloat(row.gasUsed) * parseFloat(row.gasPrice) / 1e18; // Convert from wei to ETH
        const feeMoneyResult = Money.create(feeAmount, 'ETH');
        if (feeMoneyResult.isSuccess) {
          feeResult = feeMoneyResult.value;
        }
      }

      const transaction = Transaction.fromPersistence({
        id: row.id.toString(),
        walletId: row.walletId?.toString() || '',
        type: row.type as TransactionType,
        fromAddress: fromAddressResult.value,
        toAddress: toAddressResult.value,
        amount: amountResult.value,
        network: networkResult.value,
        txHash: row.txHash,
        status: row.status as TransactionStatus,
        blockNumber: row.blockNumber,
        gasUsed: row.gasUsed ? parseInt(row.gasUsed) : undefined,
        gasPrice: row.gasPrice ? parseInt(row.gasPrice) : undefined,
        fee: feeResult,
        confirmations: 0, // This should be calculated elsewhere
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });

      return Result.success(transaction);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  private toPersistenceModel(transaction: any) {
    return {
      id: transaction.id ? parseInt(transaction.id) : undefined,
      walletId: transaction.walletId ? parseInt(transaction.walletId) : null,
      txHash: transaction.txHash || `pending-${crypto.randomUUID()}`,
      amount: transaction.amount.amount.toString(),
      type: transaction.type,
      status: transaction.status,
      fromAddress: transaction.fromAddress.value,
      toAddress: transaction.toAddress.value,
      blockNumber: transaction.blockNumber,
      gasUsed: transaction.gasUsed?.toString(),
      gasPrice: transaction.gasPrice?.toString(),
      network: transaction.network.value.toUpperCase(),
      coin: transaction.amount.currency,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}