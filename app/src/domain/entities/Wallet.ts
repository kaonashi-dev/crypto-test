import { Result } from '../shared/Result';
import { InsufficientFundsError } from '../shared/DomainError';
import { Address } from '../value-objects/Address';
import { Network } from '../value-objects/Network';
import { Money } from '../value-objects/Money';

export type WalletStatus = 'active' | 'inactive';

export interface WalletProps {
  id: string;
  merchantId: string;
  address: Address;
  network: Network;
  balance: Money;
  status: WalletStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Wallet {
  private constructor(private props: WalletProps) {}

  static create(
    merchantId: string,
    network: Network
  ): Wallet {
    const address = Address.generate(network);
    // Use the native currency for each network
    const currency = this.getNativeCurrency(network);
    const balance = Money.zero(currency);
    const now = new Date();

    return new Wallet({
      id: crypto.randomUUID(),
      merchantId,
      address,
      network,
      balance,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: WalletProps): Wallet {
    return new Wallet(props);
  }

  get id(): string {
    return this.props.id;
  }

  get merchantId(): string {
    return this.props.merchantId;
  }

  get address(): Address {
    return this.props.address;
  }

  get network(): Network {
    return this.props.network;
  }

  get balance(): Money {
    return this.props.balance;
  }

  get status(): WalletStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isActive(): boolean {
    return this.props.status === 'active';
  }

  belongsToMerchant(merchantId: string): boolean {
    return this.props.merchantId === merchantId;
  }

  canSend(amount: Money): Result<void, InsufficientFundsError> {
    if (!this.isActive()) {
      return Result.failure(new InsufficientFundsError(amount.amount, 0));
    }

    if (this.props.balance.isLessThan(amount)) {
      return Result.failure(new InsufficientFundsError(amount.amount, this.props.balance.amount));
    }

    return Result.success(undefined);
  }

  debit(amount: Money): Result<void, InsufficientFundsError> {
    const canSendResult = this.canSend(amount);
    if (canSendResult.isFailure) {
      return canSendResult;
    }

    const subtractResult = this.props.balance.subtract(amount);
    if (subtractResult.isFailure) {
      return Result.failure(new InsufficientFundsError(amount.amount, this.props.balance.amount));
    }

    this.props.balance = subtractResult.value;
    this.props.updatedAt = new Date();
    return Result.success(undefined);
  }

  credit(amount: Money): Result<void, Error> {
    const addResult = this.props.balance.add(amount);
    if (addResult.isFailure) {
      return Result.failure(addResult.error);
    }

    this.props.balance = addResult.value;
    this.props.updatedAt = new Date();
    return Result.success(undefined);
  }

  activate(): void {
    this.props.status = 'active';
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.status = 'inactive';
    this.props.updatedAt = new Date();
  }

  updateBalance(newBalance: Money): Result<void, Error> {
    if (newBalance.currency !== this.props.balance.currency) {
      return Result.failure(new Error('Currency mismatch'));
    }

    this.props.balance = newBalance;
    this.props.updatedAt = new Date();
    return Result.success(undefined);
  }

  private static getNativeCurrency(network: Network): string {
    switch (network.value) {
      case 'bitcoin':
        return 'BTC';
      case 'ethereum':
        return 'ETH';
      case 'polygon':
        return 'MATIC';
      case 'tron':
        return 'TRX';
      default:
        return 'ETH';
    }
  }

  toSnapshot(): WalletProps {
    return {
      ...this.props,
      address: this.props.address,
      network: this.props.network,
      balance: this.props.balance,
    };
  }
}