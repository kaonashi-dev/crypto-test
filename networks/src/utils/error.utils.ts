export class NetworkError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class InsufficientBalanceError extends Error {
  constructor(
    public required: string,
    public available: string,
    public currency: string
  ) {
    super(`Insufficient ${currency} balance. Required: ${required}, Available: ${available}`);
    this.name = 'InsufficientBalanceError';
  }
}

export class TransactionError extends Error {
  constructor(message: string, public txHash?: string, public originalError?: unknown) {
    super(message);
    this.name = 'TransactionError';
  }
}

export function handleError(error: unknown): { success: false; error: string } {
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    };
  }
  return {
    success: false,
    error: 'Unknown error occurred',
  };
}
