import { AsyncResult } from '../shared/Result';
import { Transaction, TransactionStatus, TransactionType } from '../entities/Transaction';
import { Address } from '../value-objects/Address';

export interface TransactionRepository {
  findById(id: string): AsyncResult<Transaction | null>;
  findByTxHash(txHash: string): AsyncResult<Transaction | null>;
  findByWalletId(walletId: string): AsyncResult<Transaction[]>;
  findByWalletIdAndType(walletId: string, type: TransactionType): AsyncResult<Transaction[]>;
  findByWalletIdAndStatus(walletId: string, status: TransactionStatus): AsyncResult<Transaction[]>;
  findByAddress(address: Address): AsyncResult<Transaction[]>;
  findPendingTransactions(): AsyncResult<Transaction[]>;
  save(transaction: Transaction): AsyncResult<void>;
  delete(id: string): AsyncResult<void>;
  updateStatus(id: string, status: TransactionStatus): AsyncResult<void>;
}