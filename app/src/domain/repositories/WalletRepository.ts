import { AsyncResult } from '../shared/Result';
import { Wallet } from '../entities/Wallet';
import { Address } from '../value-objects/Address';
import { Network } from '../value-objects/Network';

export interface WalletRepository {
  findById(id: string): AsyncResult<Wallet | null>;
  findByMerchantId(merchantId: string): AsyncResult<Wallet[]>;
  findByAddress(address: Address): AsyncResult<Wallet | null>;
  findByMerchantIdAndNetwork(merchantId: string, network: Network): AsyncResult<Wallet[]>;
  save(wallet: Wallet): AsyncResult<void>;
  delete(id: string): AsyncResult<void>;
  exists(id: string): AsyncResult<boolean>;
}