import { Result } from '../shared/Result';
import { InvalidMerchantStatusError } from '../shared/DomainError';

export type MerchantStatus = 'active' | 'inactive' | 'suspended';

export interface MerchantProps {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  secretKey: string;
  status: MerchantStatus;
  webhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Merchant {
  private constructor(private props: MerchantProps) {}

  static create(props: Omit<MerchantProps, 'id' | 'createdAt' | 'updatedAt'>): Merchant {
    const now = new Date();
    return new Merchant({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: MerchantProps): Merchant {
    return new Merchant(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get apiKey(): string {
    return this.props.apiKey;
  }

  get secretKey(): string {
    return this.props.secretKey;
  }

  get status(): MerchantStatus {
    return this.props.status;
  }

  get webhookUrl(): string | undefined {
    return this.props.webhookUrl;
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

  canPerformOperations(): Result<void, InvalidMerchantStatusError> {
    if (!this.isActive()) {
      return Result.failure(new InvalidMerchantStatusError(this.props.status));
    }
    return Result.success(undefined);
  }

  activate(): Result<void, Error> {
    if (this.props.status === 'active') {
      return Result.failure(new Error('Merchant is already active'));
    }

    this.props.status = 'active';
    this.props.updatedAt = new Date();
    return Result.success(undefined);
  }

  deactivate(): Result<void, Error> {
    if (this.props.status === 'inactive') {
      return Result.failure(new Error('Merchant is already inactive'));
    }

    this.props.status = 'inactive';
    this.props.updatedAt = new Date();
    return Result.success(undefined);
  }

  suspend(): Result<void, Error> {
    if (this.props.status === 'suspended') {
      return Result.failure(new Error('Merchant is already suspended'));
    }

    this.props.status = 'suspended';
    this.props.updatedAt = new Date();
    return Result.success(undefined);
  }

  updateWebhookUrl(url: string): void {
    this.props.webhookUrl = url;
    this.props.updatedAt = new Date();
  }

  updateName(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  toSnapshot(): MerchantProps {
    return { ...this.props };
  }
}