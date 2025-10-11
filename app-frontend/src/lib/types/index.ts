export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Wallet {
  id: number;
  address: string;
  network: string;
  coin: string;
  balance: string;
  balanceUsd?: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Transaction {
  id: number;
  walletId: number | null;
  txHash: string;
  amount: string;
  type: 'send' | 'receive' | 'request' | 'transfer';
  status: 'pending' | 'confirmed' | 'failed';
  fromAddress: string | null;
  toAddress: string | null;
  blockNumber: number | null;
  gasUsed: string | null;
  gasPrice: string | null;
  network: string | null;
  coin: string | null;
  reference: string | null;
  merchantId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
