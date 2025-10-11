import { db } from '@/db';
import { transactions, wallets, merchants } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { ProviderFactory } from '@/providers/blockchainProvider';
import { EncryptionService } from './encryptionService';
import type { ApiResponse, CreateTransactionRequest, CreateRequestTransactionRequest, Transaction } from '@/types';

export class TransactionService {
  async createTransaction(transactionData: CreateTransactionRequest, merchantId: string): Promise<ApiResponse<Transaction>> {
    try {
      let walletData = null;

      // Handle legacy walletId approach
      if (transactionData.walletId) {
        // First get the merchant to get the numeric ID
        const [merchant] = await db
          .select()
          .from(merchants)
          .where(eq(merchants.merchantId, merchantId))
          .limit(1);

        if (!merchant) {
          return {
            success: false,
            error: 'Merchant not found'
          };
        }

        const wallet = await db
          .select()
          .from(wallets)
          .where(and(eq(wallets.id, parseInt(transactionData.walletId)), eq(wallets.merchantId, merchant.id)))
          .limit(1);

        if (!wallet.length) {
          return {
            success: false,
            error: 'Wallet not found or does not belong to merchant'
          };
        }
        walletData = wallet[0];
      }

      // Generate transaction hash (will be replaced by provider response)
      const tempTxHash = `temp_${nanoid()}`;

      // Determine addresses based on transaction type and data
      let fromAddress = transactionData.fromAddress;
      let toAddress = transactionData.toAddress;

      if (transactionData.type === 'send' && walletData) {
        fromAddress = walletData.address;
      } else if (transactionData.type === 'receive' && walletData) {
        toAddress = walletData.address;
      }

      // Create transaction record with new schema
      const [transaction] = await db.insert(transactions).values({
        walletId: transactionData.walletId ? parseInt(transactionData.walletId) : null,
        txHash: tempTxHash,
        amount: transactionData.amount,
        type: transactionData.type,
        status: 'pending',
        fromAddress,
        toAddress,
        network: transactionData.network,
        coin: transactionData.coin,
        reference: transactionData.reference,
        merchantId: merchantId
      }).returning();

      if (!transaction) {
        return {
          success: false,
          error: 'Failed to create transaction'
        };
      }

      // Process with blockchain provider
      const providerResult = await this.processWithProviderNew(transaction as Transaction, transactionData);

      if (!providerResult.success) {
        // Update transaction status to failed
        await db
          .update(transactions)
          .set({
            status: 'failed',
            updatedAt: new Date()
          })
          .where(eq(transactions.id, transaction.id));

        return {
          success: false,
          error: providerResult.error || 'Transaction failed to process'
        };
      }

      // Update transaction with provider response
      const [updatedTransaction] = await db
        .update(transactions)
        .set({
          txHash: providerResult.txHash || transaction.txHash,
          status: (providerResult.status as 'pending' | 'confirmed' | 'failed') || 'pending',
          blockNumber: providerResult.blockNumber || null,
          gasUsed: providerResult.gasUsed || null,
          gasPrice: providerResult.gasPrice || null,
          updatedAt: new Date()
        })
        .where(eq(transactions.id, transaction.id))
        .returning();

      return {
        success: true,
        data: updatedTransaction as Transaction,
        message: 'Transaction created successfully'
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return {
        success: false,
        error: 'Failed to create transaction'
      };
    }
  }

  async createRequestTransaction(requestData: CreateRequestTransactionRequest, merchantId: string): Promise<ApiResponse<{ transaction: Transaction; wallet: any }>> {
    try {
      console.log('🔍 Creating request transaction for merchant:', merchantId);
      console.log('📋 Request data:', requestData);

      // First, get the merchant to get the merchant ID for wallet lookup
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.merchantId, merchantId))
        .limit(1);

      if (!merchant) {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }

      console.log('✅ Merchant found:', merchant.name);

      // Find existing wallet for this merchant, network, and coin
      const existingWallet = await db
        .select()
        .from(wallets)
        .where(and(
          eq(wallets.merchantId, merchant.id),
          eq(wallets.network, requestData.network),
          eq(wallets.coin, requestData.coin),
          eq(wallets.status, 'active')
        ))
        .limit(1);

      if (existingWallet.length === 0) {
        return {
          success: false,
          error: `No active wallet found for merchant with network ${requestData.network} and coin ${requestData.coin}. Please create a wallet first.`
        };
      }

      const wallet = existingWallet[0];
      if (!wallet) {
        return {
          success: false,
          error: 'Wallet data is invalid'
        };
      }
      console.log('✅ Using existing merchant wallet:', wallet.address);

      // Generate transaction hash
      const transactionTxHash = nanoid();

      // Create transaction record with type 'request'
      const [transaction] = await db.insert(transactions).values({
        walletId: wallet.id,
        txHash: transactionTxHash,
        amount: requestData.amount,
        type: 'request',
        status: 'pending',
        toAddress: wallet.address,
        network: requestData.network,
        coin: requestData.coin,
        reference: requestData.reference,
        merchantId: merchantId
      }).returning();

      if (!transaction) {
        return {
          success: false,
          error: 'Failed to create transaction'
        };
      }

      console.log('✅ Transaction created with ID:', transaction.id);

      return {
        success: true,
        data: {
          transaction: transaction as Transaction,
          wallet: {
            id: wallet.id,
            address: wallet.address,
            network: wallet.network,
            coin: wallet.coin,
            balance: wallet.balance,
            status: wallet.status,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt
          }
        },
        message: 'Request transaction created successfully'
      };

    } catch (error) {
      console.error('❌ Error creating request transaction:', error);
      return {
        success: false,
        error: 'Failed to create request transaction'
      };
    }
  }

  async getTransaction(txHash: string, merchantId: string): Promise<ApiResponse<Transaction>> {
    try {
      // First get the merchant to get the numeric ID
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.merchantId, merchantId))
        .limit(1);

      if (!merchant) {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }

      // First try to get transaction with wallet join (legacy)
      let transaction = await db
        .select({
          id: transactions.id,
          walletId: transactions.walletId,
          txHash: transactions.txHash,
          amount: transactions.amount,
          type: transactions.type,
          status: transactions.status,
          fromAddress: transactions.fromAddress,
          toAddress: transactions.toAddress,
          blockNumber: transactions.blockNumber,
          gasUsed: transactions.gasUsed,
          gasPrice: transactions.gasPrice,
          network: transactions.network,
          coin: transactions.coin,
          reference: transactions.reference,
          merchantId: transactions.merchantId,
          createdAt: transactions.createdAt,
          updatedAt: transactions.updatedAt,
          // Join wallet to verify ownership (for legacy transactions)
          walletMerchantId: wallets.merchantId
        })
        .from(transactions)
        .leftJoin(wallets, eq(transactions.walletId, wallets.id))
        .where(and(
          eq(transactions.txHash, txHash),
          or(
            eq(wallets.merchantId, merchant.id), // Legacy wallet-based transactions
            eq(transactions.merchantId, merchantId) // New direct merchant transactions
          )
        ))
        .limit(1);

      // If not found with join, try direct merchant ID lookup (new transactions)
      if (!transaction.length) {
        const directTransaction = await db
          .select()
          .from(transactions)
          .where(and(
            eq(transactions.txHash, txHash),
            eq(transactions.merchantId, merchantId)
          ))
          .limit(1);

        if (directTransaction.length > 0) {
          transaction = [directTransaction[0] as any];
        }
      }

      if (!transaction.length) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      const transactionData = transaction[0];
      if (!transactionData) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      // Check for updates from provider if transaction is still pending
      if (transactionData.status === 'pending') {
        const statusUpdate = await this.checkTransactionStatusNew(transactionData);
        if (statusUpdate) {
          // Update in database
          await db
            .update(transactions)
            .set({
              status: statusUpdate.status as 'pending' | 'confirmed' | 'failed',
              blockNumber: statusUpdate.blockNumber || null,
              gasUsed: statusUpdate.gasUsed || null,
              gasPrice: statusUpdate.gasPrice || null,
              updatedAt: new Date()
            })
            .where(eq(transactions.id, transactionData.id));

          // Update local object
          transactionData.status = statusUpdate.status as 'pending' | 'confirmed' | 'failed';
          transactionData.blockNumber = statusUpdate.blockNumber || null;
          transactionData.gasUsed = statusUpdate.gasUsed || null;
          transactionData.gasPrice = statusUpdate.gasPrice || null;
        }
      }

      // Remove the join field before returning if it exists
      const { walletMerchantId, ...cleanTransaction } = transactionData as any;

      return {
        success: true,
        data: cleanTransaction as Transaction
      };
    } catch (error) {
      console.error('Error retrieving transaction:', error);
      return {
        success: false,
        error: 'Failed to retrieve transaction'
      };
    }
  }

  async getTransactionsByWallet(walletId: string, merchantId: string): Promise<ApiResponse<Transaction[]>> {
    try {
      // First get the merchant to get the numeric ID
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.merchantId, merchantId))
        .limit(1);

      if (!merchant) {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }

      // Verify wallet belongs to merchant
      const wallet = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.id, parseInt(walletId)), eq(wallets.merchantId, merchant.id)))
        .limit(1);

      if (!wallet.length) {
        return {
          success: false,
          error: 'Wallet not found or does not belong to merchant'
        };
      }

      const transactionsList = await db
        .select()
        .from(transactions)
        .where(eq(transactions.walletId, parseInt(walletId)))
        .orderBy(desc(transactions.createdAt));

      return {
        success: true,
        data: transactionsList as Transaction[]
      };
    } catch (error) {
      console.error('Error retrieving transactions:', error);
      return {
        success: false,
        error: 'Failed to retrieve transactions'
      };
    }
  }

  async getWalletAddress(walletId: string, merchantId: string): Promise<ApiResponse<{ address: string; network: string; coin: string }>> {
    try {
      // First get the merchant to get the numeric ID
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.merchantId, merchantId))
        .limit(1);

      if (!merchant) {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }

      // Get wallet information
      const wallet = await db
        .select({
          address: wallets.address,
          network: wallets.network,
          coin: wallets.coin
        })
        .from(wallets)
        .where(and(eq(wallets.id, parseInt(walletId)), eq(wallets.merchantId, merchant.id)))
        .limit(1);

      if (!wallet.length) {
        return {
          success: false,
          error: 'Wallet not found or does not belong to merchant'
        };
      }

      const walletData = wallet[0];

      return {
        success: true,
        data: {
          address: walletData!.address,
          network: walletData!.network,
          coin: walletData!.coin
        }
      };
    } catch (error) {
      console.error('Error retrieving wallet address:', error);
      return {
        success: false,
        error: 'Failed to retrieve wallet address'
      };
    }
  }

  // Provider integration methods
  private async processWithProvider(transaction: Transaction, wallet: any): Promise<{
    success: boolean;
    txHash?: string;
    status?: string;
    blockNumber?: number;
    gasUsed?: string;
    gasPrice?: string;
    error?: string;
  }> {
    try {
      // Create provider instance for the wallet's network
      const provider = ProviderFactory.createProvider(wallet.network);

      // Validate addresses
      if (transaction.toAddress && !provider.validateAddress(transaction.toAddress)) {
        return {
          success: false,
          error: 'Invalid destination address'
        };
      }

      if (transaction.fromAddress && !provider.validateAddress(transaction.fromAddress)) {
        return {
          success: false,
          error: 'Invalid source address'
        };
      }

      // For send transactions, actually process the transaction
      if (transaction.type === 'send') {
        const transactionRequest = {
          fromAddress: transaction.fromAddress || wallet.address,
          toAddress: transaction.toAddress!,
          amount: transaction.amount,
          network: wallet.network,
          coin: wallet.coin as 'BTC' | 'ETH' | 'BNB' | 'USDT' | 'MATIC' | 'TRX'
        };

        const result = await provider.sendTransaction(transactionRequest);

        return {
          success: result.success,
          txHash: result.txHash,
          status: result.status,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed,
          gasPrice: result.gasPrice,
          error: result.error
        };
      } else {
        // For receive transactions, we're just recording them for tracking
        // The actual transaction happens externally
        return {
          success: true,
          txHash: transaction.txHash, // Keep the temp hash until we get the real one
          status: 'pending'
        };
      }
    } catch (error) {
      console.error('Provider processing error:', error);
      return {
        success: false,
        error: 'Provider processing failed'
      };
    }
  }

  // New method for handling network-based transactions
  private async processWithProviderNew(transaction: Transaction, transactionData: CreateTransactionRequest): Promise<{
    success: boolean;
    txHash?: string;
    status?: string;
    blockNumber?: number;
    gasUsed?: string;
    gasPrice?: string;
    error?: string;
  }> {
    try {
      // Create provider instance for the specified network
      const provider = ProviderFactory.createProvider(transactionData.network);

      // Validate addresses
      if (transaction.toAddress && !provider.validateAddress(transaction.toAddress)) {
        return {
          success: false,
          error: 'Invalid destination address'
        };
      }

      if (transaction.fromAddress && !provider.validateAddress(transaction.fromAddress)) {
        return {
          success: false,
          error: 'Invalid source address'
        };
      }

      // For send transactions, actually process the transaction
      if (transaction.type === 'send') {
        if (!transaction.fromAddress || !transaction.toAddress) {
          return {
            success: false,
            error: 'From and to addresses are required for send transactions'
          };
        }

        // Get wallet data to retrieve private key
        const [wallet] = await db
          .select()
          .from(wallets)
          .where(eq(wallets.id, transaction.walletId!))
          .limit(1);

        if (!wallet) {
          return {
            success: false,
            error: 'Wallet not found'
          };
        }

        if (!wallet.privateKeyEncrypted) {
          return {
            success: false,
            error: 'Wallet private key not available'
          };
        }

        const privateKey = this.decryptPrivateKey(wallet.privateKeyEncrypted);

        if (!privateKey) {
          return {
            success: false,
            error: 'Failed to decrypt private key'
          };
        }

        // Create transaction request for the provider
        const transactionRequest = {
          fromAddress: transaction.fromAddress!,
          toAddress: transaction.toAddress!,
          amount: transaction.amount.toString(),
          network: wallet.network as 'BTC' | 'ETH' | 'POLYGON' | 'BNB' | 'TRON',
          coin: wallet.coin as 'BTC' | 'ETH' | 'USDT' | 'MATIC' | 'BNB' | 'TRX',
          privateKey: privateKey
        };

        // Send transaction using blockchain provider
        const result = await provider.sendTransaction(transactionRequest);

        if (!result.success) {
          return {
            success: false,
            error: result.error || 'Transaction failed'
          };
        }

        // Update transaction with real hash and status
        await db
          .update(transactions)
          .set({
            txHash: result.txHash,
            status: result.status || 'pending',
            updatedAt: new Date()
          })
          .where(eq(transactions.id, transaction.id));

        return {
          success: true,
          txHash: result.txHash,
          status: result.status || 'pending'
        };
      } else {
        // For receive transactions, we're just recording them for tracking
        // The actual transaction happens externally
        return {
          success: true,
          txHash: transaction.txHash, // Keep the temp hash until we get the real one
          status: 'pending'
        };
      }
    } catch (error) {
      console.error('Provider processing error:', error);
      return {
        success: false,
        error: 'Provider processing failed'
      };
    }
  }


  /**
   * Decrypt private key from encrypted storage
   * For demo purposes, this is a simple implementation
   * In production, use proper key management services
   */
  private decryptPrivateKey(encryptedKey: string): string | null {
    try {
      // For demo purposes, we'll assume the key is stored as "encrypted_<key>_<timestamp>"
      // In production, you would use proper encryption/decryption
      if (encryptedKey.startsWith('encrypted_')) {
        const parts = encryptedKey.split('_');
        if (parts.length >= 3) {
          // Return the middle part which should be the actual key
          return parts[1] || null;
        }
      }

      // If it's not in the expected format, try to use it as-is (for demo)
      return encryptedKey || null;
    } catch (error) {
      console.error('Error decrypting private key:', error);
      return null;
    }
  }

  private async checkTransactionStatus(transaction: any): Promise<{
    status: string;
    blockNumber?: number;
    gasUsed?: string;
    gasPrice?: string;
  } | null> {
    try {
      // Get the wallet to determine network
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, transaction.walletId))
        .limit(1);

      if (!wallet) {
        return null;
      }

      // Create provider instance and check status
      const provider = ProviderFactory.createProvider(wallet.network as any);
      const statusResult = await provider.getTransactionStatus(transaction.txHash);

      if (statusResult.status !== transaction.status) {
        return {
          status: statusResult.status,
          blockNumber: statusResult.blockNumber,
          gasUsed: statusResult.gasUsed,
          gasPrice: statusResult.gasPrice
        };
      }

      return null; // No status change
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return null;
    }
  }

  // New method for checking status of network-based transactions
  private async checkTransactionStatusNew(transaction: any): Promise<{
    status: string;
    blockNumber?: number;
    gasUsed?: string;
    gasPrice?: string;
  } | null> {
    try {
      // For new transactions, we have the network directly
      if (transaction.network) {
        const provider = ProviderFactory.createProvider(transaction.network as any);
        const statusResult = await provider.getTransactionStatus(transaction.txHash);

        if (statusResult.status !== transaction.status) {
          return {
            status: statusResult.status,
            blockNumber: statusResult.blockNumber,
            gasUsed: statusResult.gasUsed,
            gasPrice: statusResult.gasPrice
          };
        }

        return null; // No status change
      }

      // Fall back to legacy method if no network field
      return await this.checkTransactionStatus(transaction);
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return null;
    }
  }
}

export const transactionService = new TransactionService();
