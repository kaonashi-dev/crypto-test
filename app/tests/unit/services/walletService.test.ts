import { describe, it, expect, beforeEach, jest } from 'bun:test';
import { WalletService } from '@/services/walletService';
import { walletModel } from '@/models/wallet';
import { merchantModel } from '@/models/merchant';
import type { CreateWalletRequest } from '@/types';

// Mock the models
jest.mock('@/models/wallet', () => ({
  walletModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findByMerchantId: jest.fn(),
  }
}));

jest.mock('@/models/merchant', () => ({
  merchantModel: {
    findById: jest.fn(),
  }
}));

describe('WalletService Unit Tests', () => {
  let walletService: WalletService;
  
  const mockMerchant = {
    id: 'merchant-db-id',
    merchantId: 'test-merchant-id',
    name: 'Test Merchant',
    email: 'test@example.com',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockWallet = {
    id: 'wallet-id-123',
    merchantId: 'test-merchant-id',
    address: '0x1234567890abcdef',
    network: 'ethereum',
    balance: 0,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    walletService = new WalletService();
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    const validWalletRequest: CreateWalletRequest = {
      merchantId: 'test-merchant-id',
      network: 'ethereum'
    };

    it('should create wallet for active merchant', async () => {
      (merchantModel.findById as any).mockResolvedValue(mockMerchant);
      (walletModel.create as any).mockResolvedValue(mockWallet);

      const result = await walletService.createWallet(validWalletRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWallet);
      expect(result.message).toBe('Wallet created successfully');
      expect(merchantModel.findById).toHaveBeenCalledWith('test-merchant-id');
      expect(walletModel.create).toHaveBeenCalledWith(validWalletRequest);
    });

    it('should reject wallet creation for non-existent merchant', async () => {
      (merchantModel.findById as any).mockResolvedValue(null);

      const result = await walletService.createWallet(validWalletRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merchant not found');
      expect(result.data).toBeUndefined();
      expect(walletModel.create).not.toHaveBeenCalled();
    });

    it('should reject wallet creation for inactive merchant', async () => {
      const inactiveMerchant = { ...mockMerchant, status: 'inactive' };
      (merchantModel.findById as any).mockResolvedValue(inactiveMerchant);

      const result = await walletService.createWallet(validWalletRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot create wallet for inactive merchant');
      expect(result.data).toBeUndefined();
      expect(walletModel.create).not.toHaveBeenCalled();
    });

    it('should handle wallet creation errors gracefully', async () => {
      (merchantModel.findById as any).mockResolvedValue(mockMerchant);
      (walletModel.create as any).mockRejectedValue(new Error('Database error'));

      const result = await walletService.createWallet(validWalletRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create wallet');
      expect(result.data).toBeUndefined();
    });

    it('should create Bitcoin wallet', async () => {
      const bitcoinRequest = { ...validWalletRequest, network: 'bitcoin' as const };
      const bitcoinWallet = { ...mockWallet, network: 'bitcoin' };
      
      (merchantModel.findById as any).mockResolvedValue(mockMerchant);
      (walletModel.create as any).mockResolvedValue(bitcoinWallet);

      const result = await walletService.createWallet(bitcoinRequest);

      expect(result.success).toBe(true);
      expect(result.data?.network).toBe('bitcoin');
    });

    it('should create Polygon wallet', async () => {
      const polygonRequest = { ...validWalletRequest, network: 'polygon' as const };
      const polygonWallet = { ...mockWallet, network: 'polygon' };
      
      (merchantModel.findById as any).mockResolvedValue(mockMerchant);
      (walletModel.create as any).mockResolvedValue(polygonWallet);

      const result = await walletService.createWallet(polygonRequest);

      expect(result.success).toBe(true);
      expect(result.data?.network).toBe('polygon');
    });
  });

  describe('getWalletByIdAndMerchant', () => {
    it('should return wallet when it belongs to merchant', async () => {
      (walletModel.findById as any).mockResolvedValue(mockWallet);

      const result = await walletService.getWalletByIdAndMerchant('wallet-id-123', 'test-merchant-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWallet);
      expect(walletModel.findById).toHaveBeenCalledWith('wallet-id-123');
    });

    it('should return error when wallet does not exist', async () => {
      (walletModel.findById as any).mockResolvedValue(null);

      const result = await walletService.getWalletByIdAndMerchant('non-existent-wallet', 'test-merchant-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet not found');
      expect(result.data).toBeUndefined();
    });

    it('should return error when wallet belongs to different merchant', async () => {
      const otherMerchantWallet = { ...mockWallet, merchantId: 'other-merchant-id' };
      (walletModel.findById as any).mockResolvedValue(otherMerchantWallet);

      const result = await walletService.getWalletByIdAndMerchant('wallet-id-123', 'test-merchant-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet does not belong to this merchant');
      expect(result.data).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      (walletModel.findById as any).mockRejectedValue(new Error('Database error'));

      const result = await walletService.getWalletByIdAndMerchant('wallet-id-123', 'test-merchant-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve wallet');
      expect(result.data).toBeUndefined();
    });
  });

  describe('getWalletsByMerchantId', () => {
    it('should return all wallets for valid merchant', async () => {
      const mockWallets = [
        mockWallet,
        { ...mockWallet, id: 'wallet-id-456', network: 'bitcoin' }
      ];
      
      (merchantModel.findById as any).mockResolvedValue(mockMerchant);
      (walletModel.findByMerchantId as any).mockResolvedValue(mockWallets);

      const result = await walletService.getWalletsByMerchantId('test-merchant-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWallets);
      expect(merchantModel.findById).toHaveBeenCalledWith('test-merchant-id');
      expect(walletModel.findByMerchantId).toHaveBeenCalledWith('test-merchant-id');
    });

    it('should return empty array when merchant has no wallets', async () => {
      (merchantModel.findById as any).mockResolvedValue(mockMerchant);
      (walletModel.findByMerchantId as any).mockResolvedValue([]);

      const result = await walletService.getWalletsByMerchantId('test-merchant-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return error for non-existent merchant', async () => {
      (merchantModel.findById as any).mockResolvedValue(null);

      const result = await walletService.getWalletsByMerchantId('non-existent-merchant');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merchant not found');
      expect(result.data).toBeUndefined();
      expect(walletModel.findByMerchantId).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      (merchantModel.findById as any).mockResolvedValue(mockMerchant);
      (walletModel.findByMerchantId as any).mockRejectedValue(new Error('Database error'));

      const result = await walletService.getWalletsByMerchantId('test-merchant-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve wallets');
      expect(result.data).toBeUndefined();
    });

    it('should handle merchant lookup errors gracefully', async () => {
      (merchantModel.findById as any).mockRejectedValue(new Error('Database error'));

      const result = await walletService.getWalletsByMerchantId('test-merchant-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve wallets');
      expect(result.data).toBeUndefined();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null wallet data from model', async () => {
      (merchantModel.findById as any).mockResolvedValue(mockMerchant);
      (walletModel.create as any).mockResolvedValue(null);

      const result = await walletService.createWallet({
        merchantId: 'test-merchant-id',
        network: 'ethereum'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle undefined responses from merchant model', async () => {
      (merchantModel.findById as any).mockResolvedValue(undefined);

      const result = await walletService.createWallet({
        merchantId: 'test-merchant-id',
        network: 'ethereum'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merchant not found');
    });
  });
});