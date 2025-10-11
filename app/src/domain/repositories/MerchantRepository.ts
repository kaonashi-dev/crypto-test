import { AsyncResult } from '../shared/Result';
import { Merchant } from '../entities/Merchant';

export interface MerchantRepository {
  findById(id: string): AsyncResult<Merchant | null>;
  findByApiKey(apiKey: string): AsyncResult<Merchant | null>;
  findByEmail(email: string): AsyncResult<Merchant | null>;
  save(merchant: Merchant): AsyncResult<void>;
  delete(id: string): AsyncResult<void>;
  findAll(): AsyncResult<Merchant[]>;
}