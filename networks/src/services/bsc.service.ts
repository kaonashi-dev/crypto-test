import { ethers } from 'ethers';
import type {
  EthereumWallet,
  WalletBalance,
  TransactionResult,
  TransactionStatus,
} from '../types/wallet.types.ts';
import { BSC_NETWORKS, BSC_USDT_ABI } from '../config/bsc.config.ts';
import {
  validateEthereumAddress,
  validateAmount,
} from '../utils/validation.utils.ts';
import { InsufficientBalanceError, handleError } from '../utils/error.utils.ts';
import { Logger } from '../utils/logger.utils.ts';

type BSCNetwork = 'mainnet' | 'testnet';

interface BSCOrder {
  id: string;
  amount: number;
  expectedAmountWei: string;
  decimals: string;
  description: string;
  paymentAddress: string;
  privateKey: string;
  status: 'pending' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
  network: string;
  explorerUrl: string;
  transactionHash: string | null;
  completedAt?: string;
  expiredAt?: string;
  receivedAmount?: number;
}

export class BSCPaymentService {
  private provider: ethers.JsonRpcProvider;
  private networkConfig: typeof BSC_NETWORKS.mainnet | typeof BSC_NETWORKS.testnet;
  private orders: Map<string, BSCOrder>;
  private usdtAddress: string;

  constructor(network: BSCNetwork = 'testnet') {
    this.networkConfig = BSC_NETWORKS[network];
    const infuraKey = Bun.env.INFURA_API_KEY || '';

    Logger.network(`Connecting to ${this.networkConfig.name}`, this.networkConfig.url + infuraKey);
    this.provider = new ethers.JsonRpcProvider(`${this.networkConfig.url}${infuraKey}`);

    this.orders = new Map();
    this.usdtAddress = validateEthereumAddress(this.networkConfig.usdtContract);
  }

  createWallet(): EthereumWallet {
    try {
      const wallet = ethers.Wallet.createRandom();
      const connectedWallet = wallet.connect(this.provider);

      const walletData: EthereumWallet = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: (wallet as any).publicKey,
      };

      Logger.success('BSC Wallet created', {
        address: walletData.address,
        network: this.networkConfig.name,
      });

      return walletData;
    } catch (error) {
      Logger.error('Error creating BSC wallet', error);
      throw error;
    }
  }

  importWallet(privateKey: string): EthereumWallet {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const connectedWallet = wallet.connect(this.provider);

      const walletData: EthereumWallet = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.mnemonic?.phrase,
      };

      Logger.success('BSC Wallet imported', {
        address: walletData.address,
        network: this.networkConfig.name,
      });

      return walletData;
    } catch (error) {
      Logger.error('Error importing BSC wallet', error);
      throw error;
    }
  }

  async checkBalance(address: string, token: 'both' | 'bnb' | 'usdt' = 'both'): Promise<any> {
    try {
      const validAddress = validateEthereumAddress(address);
      const balances: any = {};

      if (token === 'both' || token === 'bnb') {
        const bnbBalance = await this.provider.getBalance(validAddress);
        balances.bnb = {
          raw: bnbBalance.toString(),
          formatted: ethers.formatEther(bnbBalance),
          symbol: this.networkConfig.nativeCurrency,
        };
      }

      if (token === 'both' || token === 'usdt') {
        const usdtContract = new ethers.Contract(this.usdtAddress, BSC_USDT_ABI, this.provider);

        const usdtBalance = await usdtContract.balanceOf(validAddress);
        const decimals = await usdtContract.decimals();

        balances.usdt = {
          raw: usdtBalance.toString(),
          formatted: ethers.formatUnits(usdtBalance, decimals),
          symbol: 'USDT',
          decimals: decimals.toString(),
        };
      }

      Logger.balance(`Balances for ${validAddress}`, balances);

      return balances;
    } catch (error) {
      Logger.error('Error checking balance', error);
      throw error;
    }
  }

  async createTransaction(
    amountUSDT: number,
    walletData: EthereumWallet,
    description: string = 'Payment test',
    expirationMinutes: number = 5
  ): Promise<BSCOrder> {
    try {
      validateAmount(amountUSDT);
      Logger.transaction(`Creating transaction for ${amountUSDT} USDT`);

      const validPaymentAddress = validateEthereumAddress(walletData.address);

      const usdtContract = new ethers.Contract(this.usdtAddress, BSC_USDT_ABI, this.provider);

      const decimals = await usdtContract.decimals();
      const expectedAmount = ethers.parseUnits(amountUSDT.toString(), decimals);

      const transaction: BSCOrder = {
        id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        amount: amountUSDT,
        expectedAmountWei: expectedAmount.toString(),
        decimals: decimals.toString(),
        description,
        paymentAddress: validPaymentAddress,
        privateKey: walletData.privateKey,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString(),
        network: this.networkConfig.name,
        explorerUrl: `${this.networkConfig.explorerUrl}/address/${validPaymentAddress}`,
        transactionHash: null,
      };

      this.orders.set(transaction.id, transaction);

      Logger.success('Transaction created', {
        id: transaction.id,
        amount: `${transaction.amount} USDT`,
        address: transaction.paymentAddress,
        network: transaction.network,
        expires: new Date(transaction.expiresAt).toLocaleString(),
      });

      this.startMonitoring(transaction.id);

      return transaction;
    } catch (error) {
      Logger.error('Error creating transaction', error);
      throw error;
    }
  }

  async getTransactionStatus(transactionId: string): Promise<any> {
    try {
      const transaction = this.orders.get(transactionId);

      if (!transaction) {
        return {
          error: 'Transaction not found',
          id: transactionId,
        };
      }

      if (new Date() > new Date(transaction.expiresAt) && transaction.status === 'pending') {
        transaction.status = 'expired';
        transaction.expiredAt = new Date().toISOString();
        this.orders.set(transactionId, transaction);
      }

      if (transaction.status === 'pending') {
        try {
          const balances = await this.checkBalance(transaction.paymentAddress, 'usdt');
          const currentBalance = parseFloat(balances.usdt.formatted);

          if (currentBalance >= transaction.amount) {
            transaction.status = 'completed';
            transaction.completedAt = new Date().toISOString();
            transaction.receivedAmount = currentBalance;

            this.orders.set(transactionId, transaction);
            Logger.success(`Transaction ${transactionId} completed manually!`);
          }
        } catch (balanceError) {
          Logger.warning('Error checking balance for verification', balanceError);
        }
      }

      const status = {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        description: transaction.description,
        paymentAddress: transaction.paymentAddress,
        network: transaction.network,
        createdAt: transaction.createdAt,
        expiresAt: transaction.expiresAt,
        transactionHash: transaction.transactionHash,
        explorerUrl: transaction.explorerUrl,
        completedAt: transaction.completedAt,
        expiredAt: transaction.expiredAt,
        receivedAmount: transaction.receivedAmount,
      };

      Logger.info(`Transaction ${transactionId} status`, {
        status: status.status,
        amount: `${status.amount} USDT`,
      });

      return status;
    } catch (error) {
      Logger.error('Error getting transaction status', error);
      throw error;
    }
  }

  async startMonitoring(transactionId: string): Promise<void> {
    const transaction = this.orders.get(transactionId);
    if (!transaction) return;

    Logger.info(`Starting monitoring for transaction: ${transactionId}`);

    try {
      const usdtContract = new ethers.Contract(this.usdtAddress, BSC_USDT_ABI, this.provider);

      const filter = {
        address: this.usdtAddress,
        topics: [
          ethers.id('Transfer(address,address,uint256)'),
          null,
          ethers.zeroPadValue(transaction.paymentAddress, 32),
        ],
      };

      const eventListener = async (log: any) => {
        try {
          const parsedLog = usdtContract.interface.parseLog(log);
          if (!parsedLog) return;

          const receivedAmount = parsedLog.args.value;
          const decimals = await usdtContract.decimals();
          const formattedAmount = ethers.formatUnits(receivedAmount, decimals);

          Logger.balance(`Payment received for ${transactionId}`, `${formattedAmount} USDT`);
          Logger.info(`TX Hash: ${log.transactionHash}`);

          if (receivedAmount >= BigInt(transaction.expectedAmountWei)) {
            transaction.status = 'completed';
            transaction.transactionHash = log.transactionHash;
            transaction.completedAt = new Date().toISOString();
            transaction.receivedAmount = parseFloat(formattedAmount);

            this.orders.set(transactionId, transaction);

            Logger.success(`Transaction ${transactionId} COMPLETED!`);
            Logger.info(`View on explorer: ${this.networkConfig.explorerUrl}/tx/${log.transactionHash}`);

            this.provider.off(filter, eventListener);
          }
        } catch (error) {
          Logger.error('Error processing event', error);
        }
      };

      this.provider.on(filter, eventListener);

      // Backup polling every 30 seconds
      const pollingInterval = setInterval(async () => {
        try {
          const currentTransaction = this.orders.get(transactionId);
          if (!currentTransaction || currentTransaction.status !== 'pending') {
            clearInterval(pollingInterval);
            return;
          }

          if (new Date() > new Date(currentTransaction.expiresAt)) {
            currentTransaction.status = 'expired';
            currentTransaction.expiredAt = new Date().toISOString();
            this.orders.set(transactionId, currentTransaction);
            Logger.warning(`Transaction ${transactionId} expired`);
            clearInterval(pollingInterval);
            this.provider.off(filter, eventListener);
            return;
          }

          try {
            const balance = await usdtContract.balanceOf(currentTransaction.paymentAddress);
            const decimals = await usdtContract.decimals();
            const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));

            if (balanceFormatted >= currentTransaction.amount) {
              currentTransaction.status = 'completed';
              currentTransaction.completedAt = new Date().toISOString();
              currentTransaction.receivedAmount = balanceFormatted;

              this.orders.set(transactionId, currentTransaction);
              Logger.success(`Transaction ${transactionId} completed by polling!`);
              clearInterval(pollingInterval);
              this.provider.off(filter, eventListener);
            }
          } catch (pollError) {
            Logger.warning('Error in polling balance', pollError);
          }
        } catch (error) {
          Logger.error('Error in polling', error);
        }
      }, 30000);
    } catch (error) {
      Logger.error('Error starting monitoring', error);
    }
  }

  getAllTransactions(): BSCOrder[] {
    const transactions = Array.from(this.orders.values());
    Logger.info(`Total transactions: ${transactions.length}`);
    return transactions;
  }

  async testConnection(): Promise<boolean> {
    try {
      Logger.network(`Testing connection to ${this.networkConfig.name}`);

      const blockNumber = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();

      Logger.debug(`Verifying USDT contract: ${this.usdtAddress}`);
      const usdtContract = new ethers.Contract(this.usdtAddress, BSC_USDT_ABI, this.provider);

      try {
        const name = await usdtContract.name();
        const symbol = await usdtContract.symbol();
        const decimals = await usdtContract.decimals();

        Logger.success('USDT contract verified', {
          name,
          symbol,
          decimals: decimals.toString(),
          address: this.usdtAddress,
        });
      } catch (contractError) {
        Logger.warning('Error verifying USDT contract', contractError);
      }

      Logger.success('Connection successful', {
        network: this.networkConfig.name,
        chainId: network.chainId.toString(),
        latestBlock: blockNumber,
      });

      return true;
    } catch (error) {
      Logger.error('Connection error', error);
      return false;
    }
  }
}
