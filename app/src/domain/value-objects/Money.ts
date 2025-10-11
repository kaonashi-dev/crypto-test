import { Result } from '../shared/Result';
import { InvalidAmountError } from '../shared/DomainError';

export class Money {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: string
  ) {}

  static create(amount: number, currency: string): Result<Money, InvalidAmountError> {
    if (amount < 0) {
      return Result.failure(new InvalidAmountError(amount));
    }

    return Result.success(new Money(amount, currency.toUpperCase()));
  }

  static zero(currency: string): Money {
    return new Money(0, currency.toUpperCase());
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  add(other: Money): Result<Money, Error> {
    if (this._currency !== other._currency) {
      return Result.failure(new Error(`Cannot add different currencies: ${this._currency} and ${other._currency}`));
    }

    return Result.success(new Money(this._amount + other._amount, this._currency));
  }

  subtract(other: Money): Result<Money, Error> {
    if (this._currency !== other._currency) {
      return Result.failure(new Error(`Cannot subtract different currencies: ${this._currency} and ${other._currency}`));
    }

    const newAmount = this._amount - other._amount;
    if (newAmount < 0) {
      return Result.failure(new InvalidAmountError(newAmount));
    }

    return Result.success(new Money(newAmount, this._currency));
  }

  multiply(factor: number): Result<Money, InvalidAmountError> {
    if (factor < 0) {
      return Result.failure(new InvalidAmountError(this._amount * factor));
    }

    return Result.success(new Money(this._amount * factor, this._currency));
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount > other._amount;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount >= other._amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount < other._amount;
  }

  isZero(): boolean {
    return this._amount === 0;
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot compare different currencies: ${this._currency} and ${other._currency}`);
    }
  }

  toString(): string {
    return `${this._amount} ${this._currency}`;
  }

  toJSON(): { amount: number; currency: string } {
    return {
      amount: this._amount,
      currency: this._currency
    };
  }
}