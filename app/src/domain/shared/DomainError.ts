export abstract class DomainError extends Error {
  abstract readonly code: string;
  
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class WalletNotFoundError extends DomainError {
  readonly code = 'WALLET_NOT_FOUND';
  
  constructor(walletId: string) {
    super(`Wallet with ID ${walletId} not found`);
  }
}

export class MerchantNotFoundError extends DomainError {
  readonly code = 'MERCHANT_NOT_FOUND';
  
  constructor(merchantId: string) {
    super(`Merchant with ID ${merchantId} not found`);
  }
}

export class InvalidMerchantStatusError extends DomainError {
  readonly code = 'INVALID_MERCHANT_STATUS';
  
  constructor(status: string) {
    super(`Cannot perform operation with merchant status: ${status}`);
  }
}

export class WalletAccessDeniedError extends DomainError {
  readonly code = 'WALLET_ACCESS_DENIED';
  
  constructor() {
    super('Wallet does not belong to the requesting merchant');
  }
}

export class InvalidAddressError extends DomainError {
  readonly code = 'INVALID_ADDRESS';
  
  constructor(address: string, network: string) {
    super(`Invalid ${network} address: ${address}`);
  }
}

export class InvalidAmountError extends DomainError {
  readonly code = 'INVALID_AMOUNT';
  
  constructor(amount: number) {
    super(`Invalid amount: ${amount}. Amount must be positive`);
  }
}

export class InsufficientFundsError extends DomainError {
  readonly code = 'INSUFFICIENT_FUNDS';
  
  constructor(required: number, available: number) {
    super(`Insufficient funds. Required: ${required}, Available: ${available}`);
  }
}