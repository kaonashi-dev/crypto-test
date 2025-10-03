import { ethers } from 'ethers';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateEthereumAddress(address: string): string {
  try {
    return ethers.getAddress(address);
  } catch (error) {
    throw new ValidationError(`Invalid Ethereum address: ${address}`);
  }
}

export function validateAmount(amount: number, minAmount: number = 0): void {
  if (amount <= minAmount) {
    throw new ValidationError(`Amount must be greater than ${minAmount}`);
  }
  if (!Number.isFinite(amount)) {
    throw new ValidationError('Amount must be a valid number');
  }
}

export function validatePrivateKey(privateKey: string): void {
  if (!privateKey || privateKey === '0' || privateKey === '') {
    throw new ValidationError('Private key is required');
  }
}

export function validateRpcUrl(rpcUrl: string, networkName: string): void {
  if (!rpcUrl || rpcUrl.includes('YOUR_')) {
    throw new ValidationError(
      `RPC URL not configured for network: ${networkName}. Please set the appropriate environment variable.`
    );
  }
}
