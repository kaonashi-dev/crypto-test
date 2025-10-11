import { walletModel } from '@/models/wallet';
import { merchantModel } from '@/models/merchant';
import type { CreateWalletRequest, Wallet, ApiResponse } from '@/types';

export class WalletService {
  async createWallet(walletData: CreateWalletRequest): Promise<ApiResponse<Wallet>> {
    try {
      const merchant = await merchantModel.findById(walletData.merchantId);
      
      if (!merchant) {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }

      if (merchant.status !== 'active') {
        return {
          success: false,
          error: 'Cannot create wallet for inactive merchant'
        };
      }

      const wallet = await walletModel.create(walletData);
      
      return {
        success: true,
        data: wallet,
        message: 'Wallet created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create wallet'
      };
    }
  }

  async getWalletByIdAndMerchant(walletId: string, merchantId: string): Promise<ApiResponse<Wallet>> {
    try {
      const wallet = await walletModel.findById(walletId);
      
      if (!wallet) {
        return {
          success: false,
          error: 'Wallet not found'
        };
      }

      if (wallet.merchantId !== merchantId) {
        return {
          success: false,
          error: 'Wallet does not belong to this merchant'
        };
      }
      
      return {
        success: true,
        data: wallet
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to retrieve wallet'
      };
    }
  }

  async getWalletsByMerchantId(merchantId: string): Promise<ApiResponse<Wallet[]>> {
    try {
      const merchant = await merchantModel.findById(merchantId);
      
      if (!merchant) {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }

      const wallets = await walletModel.findByMerchantId(merchantId);
      
      return {
        success: true,
        data: wallets
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to retrieve wallets'
      };
    }
  }
}

export const walletService = new WalletService();