import { AsyncResult } from '../../domain/shared/Result';
import { Address } from '../../domain/value-objects/Address';
import { Network } from '../../domain/value-objects/Network';
import { Money } from '../../domain/value-objects/Money';

export interface BlockchainTransaction {
  hash: string;
  blockNumber?: number;
  gasUsed?: number;
  gasPrice?: number;
  fee?: Money;
}

export interface BlockchainProvider {
  getBalance(address: Address): AsyncResult<Money>;
  sendTransaction(
    fromAddress: Address,
    toAddress: Address,
    amount: Money,
    privateKey?: string
  ): AsyncResult<BlockchainTransaction>;
  getTransaction(hash: string): AsyncResult<BlockchainTransaction | null>;
  getTransactionConfirmations(hash: string): AsyncResult<number>;
  isValidAddress(address: string, network: Network): boolean;
  estimateTransactionFee(
    fromAddress: Address,
    toAddress: Address,
    amount: Money
  ): AsyncResult<Money>;
}