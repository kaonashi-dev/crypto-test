import { Address } from '../value-objects/Address';
import { Network } from '../value-objects/Network';
import { Money } from '../value-objects/Money';

export type TransactionType = 'send' | 'receive';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface TransactionProps {
  id: string;
  walletId: string;
  type: TransactionType;
  fromAddress: Address;
  toAddress: Address;
  amount: Money;
  network: Network;
  txHash?: string;
  status: TransactionStatus;
  blockNumber?: number;
  gasUsed?: number;
  gasPrice?: number;
  fee?: Money;
  confirmations: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Transaction {
  private constructor(private props: TransactionProps) {}

  static create(
    walletId: string,
    type: TransactionType,
    fromAddress: Address,
    toAddress: Address,
    amount: Money,
    network: Network
  ): Transaction {
    const now = new Date();

    return new Transaction({
      id: crypto.randomUUID(),
      walletId,
      type,
      fromAddress,
      toAddress,
      amount,
      network,
      status: 'pending',
      confirmations: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: TransactionProps): Transaction {
    return new Transaction(props);
  }

  get id(): string {
    return this.props.id;
  }

  get walletId(): string {
    return this.props.walletId;
  }

  get type(): TransactionType {
    return this.props.type;
  }

  get fromAddress(): Address {
    return this.props.fromAddress;
  }

  get toAddress(): Address {
    return this.props.toAddress;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get network(): Network {
    return this.props.network;
  }

  get txHash(): string | undefined {
    return this.props.txHash;
  }

  get status(): TransactionStatus {
    return this.props.status;
  }

  get blockNumber(): number | undefined {
    return this.props.blockNumber;
  }

  get gasUsed(): number | undefined {
    return this.props.gasUsed;
  }

  get gasPrice(): number | undefined {
    return this.props.gasPrice;
  }

  get fee(): Money | undefined {
    return this.props.fee;
  }

  get confirmations(): number {
    return this.props.confirmations;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isPending(): boolean {
    return this.props.status === 'pending';
  }

  isConfirmed(): boolean {
    return this.props.status === 'confirmed';
  }

  isFailed(): boolean {
    return this.props.status === 'failed';
  }

  isSend(): boolean {
    return this.props.type === 'send';
  }

  isReceive(): boolean {
    return this.props.type === 'receive';
  }

  setTransactionHash(txHash: string): void {
    this.props.txHash = txHash;
    this.props.updatedAt = new Date();
  }

  confirm(blockNumber?: number, gasUsed?: number, gasPrice?: number, fee?: Money): void {
    this.props.status = 'confirmed';
    if (blockNumber) this.props.blockNumber = blockNumber;
    if (gasUsed) this.props.gasUsed = gasUsed;
    if (gasPrice) this.props.gasPrice = gasPrice;
    if (fee) this.props.fee = fee;
    this.props.updatedAt = new Date();
  }

  fail(): void {
    this.props.status = 'failed';
    this.props.updatedAt = new Date();
  }

  updateConfirmations(confirmations: number): void {
    this.props.confirmations = confirmations;
    this.props.updatedAt = new Date();
  }

  isFullyConfirmed(): boolean {
    const requiredConfirmations = this.getRequiredConfirmations();
    return this.props.confirmations >= requiredConfirmations;
  }

  private getRequiredConfirmations(): number {
    switch (this.props.network.value) {
      case 'bitcoin':
        return 6;
      case 'ethereum':
        return 12;
      case 'polygon':
        return 20;
      case 'tron':
        return 20;
      default:
        return 6;
    }
  }

  toSnapshot(): TransactionProps {
    return {
      ...this.props,
      fromAddress: this.props.fromAddress,
      toAddress: this.props.toAddress,
      amount: this.props.amount,
      network: this.props.network,
      fee: this.props.fee,
    };
  }
}