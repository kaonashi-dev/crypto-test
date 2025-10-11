export interface CreateTransactionDto {
  walletId: string;
  toAddress: string;
  amount: number;
  type: 'send' | 'receive';
}

export interface TransactionResponseDto {
  id: string;
  walletId: string;
  type: 'send' | 'receive';
  fromAddress: string;
  toAddress: string;
  amount: number;
  currency: string;
  network: string;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: number;
  gasPrice?: number;
  fee?: number;
  confirmations: number;
  createdAt: Date;
  updatedAt: Date;
}