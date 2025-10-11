import { MerchantQueries } from '@/db/queries/merchantQueries';
import { db } from '@/db';
import { wallets, merchants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ProviderFactory } from '@/providers/blockchainProvider';
import type { CreateMerchantRequest, Merchant, ApiResponse } from '@/types';

export class MerchantService {
  async getMerchantById(merchantId: string): Promise<ApiResponse<Merchant>> {
    try {
      const merchant = await MerchantQueries.findByMerchantId(merchantId);
      
      if (!merchant) {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }
      
      return {
        success: true,
        data: {
          ...merchant,
          status: merchant.status as 'active' | 'inactive'
        }
      };
    } catch (error) {
      console.error('Error retrieving merchant:', error);
      return {
        success: false,
        error: 'Failed to retrieve merchant'
      };
    }
  }

  async updateMerchant(merchantId: string, updateData: { name?: string; email?: string }): Promise<ApiResponse<Merchant>> {
    try {
      // First get the merchant to get the database ID
      const existingMerchant = await MerchantQueries.findByMerchantId(merchantId);
      if (!existingMerchant) {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }

      // Check if email is being updated and if it already exists
      if (updateData.email) {
        const emailExists = await MerchantQueries.findByEmail(updateData.email);
        
        if (emailExists && emailExists.id !== existingMerchant.id) {
          return {
            success: false,
            error: 'A merchant with this email already exists'
          };
        }
      }

      // Update using the database ID
      const merchant = await MerchantQueries.update(existingMerchant.id, updateData);
      
      if (!merchant) {
        return {
          success: false,
          error: 'Failed to update merchant'
        };
      }
      
      return {
        success: true,
        data: {
          ...merchant,
          status: merchant.status as 'active' | 'inactive'
        },
        message: 'Merchant updated successfully'
      };
    } catch (error) {
      console.error('Error updating merchant:', error);
      return {
        success: false,
        error: 'Failed to update merchant'
      };
    }
  }

  async getMerchantWallet(merchantId: string, network: string, coin: string): Promise<ApiResponse<any>> {
    try {
      console.log(`🔍 Getting wallet for merchant ${merchantId}, network: ${network}, coin: ${coin}`);
      
      // First get the merchant to get the database ID
      const merchant = await MerchantQueries.findByMerchantId(merchantId);
      if (!merchant) {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }

      // Check if wallet already exists for this merchant/network/coin combination
      const existingWallet = await db
        .select()
        .from(wallets)
        .where(and(
          eq(wallets.merchantId, merchant.id),
          eq(wallets.network, network),
          eq(wallets.coin, coin)
        ))
        .limit(1);

      if (existingWallet.length > 0) {
        const wallet = existingWallet[0];
        if (!wallet) {
          throw new Error('Wallet data is undefined');
        }
        console.log('✅ Found existing wallet:', wallet.address);
        return {
          success: true,
          data: {
            address: wallet.address,
            network: wallet.network,
            coin: wallet.coin,
            balance: wallet.balance,
            status: wallet.status,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt
          },
          message: 'Wallet found'
        };
      }

      // If wallet doesn't exist, create a new one using the blockchain provider
      console.log('🔨 Creating new wallet...');
      
      try {
        const provider = ProviderFactory.createProvider(network as any);
        const walletData = await provider.createWallet();
        
        console.log('✅ Wallet created via provider:', walletData.address);

        // Store the wallet in database
        const [newWallet] = await db.insert(wallets).values({
          merchantId: merchant.id,
          address: walletData.address,
          privateKeyEncrypted: walletData.privateKey, // TODO: Encrypt this in production
          network: network,
          coin: coin,
          balance: '0',
          status: 'active'
        }).returning();

        if (!newWallet) {
          throw new Error('Failed to create wallet');
        }

        return {
          success: true,
          data: {
            address: newWallet.address,
            network: newWallet.network,
            coin: newWallet.coin,
            balance: newWallet.balance,
            status: newWallet.status,
            createdAt: newWallet.createdAt,
            updatedAt: newWallet.updatedAt
          },
          message: 'Wallet created successfully'
        };

      } catch (providerError) {
        console.error('❌ Provider error:', providerError);
        return {
          success: false,
          error: `Failed to create wallet for ${network} network: ${providerError instanceof Error ? providerError.message : 'Unknown provider error'}`
        };
      }

    } catch (error) {
      console.error('❌ Error getting merchant wallet:', error);
      return {
        success: false,
        error: 'Failed to get or create merchant wallet'
      };
    }
  }

  async getAllMerchantWallets(merchantId: string): Promise<ApiResponse<any[]>> {
    try {
      console.log(`🔍 Getting all wallets for merchant ${merchantId}`);
      
      // First get the merchant to get the database ID
      const merchant = await MerchantQueries.findByMerchantId(merchantId);
      if (!merchant) {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }

      // Get all wallets for this merchant
      const merchantWallets = await db
        .select({
          id: wallets.id,
          address: wallets.address,
          network: wallets.network,
          coin: wallets.coin,
          balance: wallets.balance,
          status: wallets.status,
          createdAt: wallets.createdAt,
          updatedAt: wallets.updatedAt
        })
        .from(wallets)
        .where(eq(wallets.merchantId, merchant.id))
        .orderBy(wallets.createdAt);

      console.log(`✅ Found ${merchantWallets.length} wallets for merchant`);

      // Update balances from blockchain providers
      const walletsWithUpdatedBalances = await Promise.all(
        merchantWallets.map(async (wallet) => {
          try {
            // Validate address format before calling provider
            const provider = ProviderFactory.createProvider(wallet.network as any);
            
            // Check if address is valid for the network
            if (!provider.validateAddress(wallet.address)) {
              console.error(`❌ Invalid ${wallet.network} address: ${wallet.address}`);
              return {
                id: wallet.id,
                address: wallet.address,
                network: wallet.network,
                coin: wallet.coin,
                balance: wallet.balance,
                balanceUsd: undefined,
                status: wallet.status,
                createdAt: wallet.createdAt,
                updatedAt: wallet.updatedAt
              };
            }
            
            console.log('🔍 Getting balance for wallet:', {
              address: wallet.address,
              coin: wallet.coin,
              network: wallet.network
            });
            const currentBalance = await provider.getWalletBalance(wallet.address, wallet.coin);
            
            // Update balance in database if different
            const currentBalanceStr = currentBalance.toString();
            if (wallet.balance !== currentBalanceStr) {
              console.log(`💰 Updating balance for ${wallet.network}/${wallet.coin} wallet: ${wallet.balance} -> ${currentBalanceStr}`);
              
              await db
                .update(wallets)
                .set({ 
                  balance: currentBalanceStr,
                  updatedAt: new Date()
                })
                .where(eq(wallets.id, wallet.id));
            }

            // TODO: Calculate USD value using exchange rates
            // For now, we'll leave balanceUsd as undefined
            let balanceUsd: string | undefined = undefined;

            return {
              id: wallet.id,
              address: wallet.address,
              network: wallet.network,
              coin: wallet.coin,
              balance: currentBalanceStr,
              balanceUsd,
              status: wallet.status,
              createdAt: wallet.createdAt,
              updatedAt: new Date() // Use current time since we potentially updated it
            };

          } catch (providerError) {
            console.error(`❌ Error getting balance for wallet ${wallet.address}:`, providerError);
            
            // Return wallet with stored balance if provider fails
            return {
              id: wallet.id,
              address: wallet.address,
              network: wallet.network,
              coin: wallet.coin,
              balance: wallet.balance,
              balanceUsd: undefined,
              status: wallet.status,
              createdAt: wallet.createdAt,
              updatedAt: wallet.updatedAt
            };
          }
        })
      );

      return {
        success: true,
        data: walletsWithUpdatedBalances,
        message: `Found ${walletsWithUpdatedBalances.length} wallets`
      };

    } catch (error) {
      console.error('❌ Error getting merchant wallets:', error);
      return {
        success: false,
        error: 'Failed to retrieve merchant wallets'
      };
    }
  }
}

export const merchantService = new MerchantService();