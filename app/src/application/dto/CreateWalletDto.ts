export interface CreateWalletDto {
  merchantId: string;
  network: string;
}

export interface WalletResponseDto {
  id: string;
  merchantId: string;
  address: string;
  network: string;
  balance: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}