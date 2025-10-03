import { TronWeb } from 'tronweb';
import type {
  TronWallet,
  WalletBalance,
  TransactionResult,
  TransactionStatus,
} from '../types/wallet.types.ts';
import {
  TRON_CONFIG,
  TRON_USDT_ABI,
  USDT_DECIMALS,
  MIN_TRX_FOR_GAS,
  TRX_TO_SUN,
} from '../config/tron.config.ts';
import { validateAmount } from '../utils/validation.utils.ts';
import { InsufficientBalanceError, handleError } from '../utils/error.utils.ts';
import { Logger } from '../utils/logger.utils.ts';

type TronNetwork = 'mainnet' | 'testnet';

export class TronService {
  private tronWeb: TronWeb;
  private networkConfig: typeof TRON_CONFIG.mainnet | typeof TRON_CONFIG.testnet;
  private isTestnet: boolean;

  constructor(network: TronNetwork = 'testnet') {
    this.isTestnet = network === 'testnet';
    this.networkConfig = TRON_CONFIG[network];

    this.tronWeb = new TronWeb({
      fullHost: this.networkConfig.fullHost,
    });

    Logger.network(`Connected to ${this.networkConfig.name}`, this.networkConfig.fullHost);
  }

  async createWallet(): Promise<TronWallet> {
    try {
      const wallet = await this.tronWeb.createAccount();

      const walletData: TronWallet = {
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey,
        address: wallet.address.base58,
        hexAddress: wallet.address.hex,
      };

      Logger.success('Tron wallet created', {
        address: walletData.address,
        network: this.networkConfig.name,
      });

      return walletData;
    } catch (error) {
      Logger.error('Error creating Tron wallet', error);
      throw error;
    }
  }

  setPrivateKey(privateKey: string): void {
    this.tronWeb.setPrivateKey(privateKey);
  }

  async getTRXBalance(address: string): Promise<WalletBalance> {
    try {
      if (!this.tronWeb.isAddress(address)) {
        throw new Error('Invalid Tron address');
      }

      const balance = await this.tronWeb.trx.getBalance(address);
      const balanceInTRX = balance / TRX_TO_SUN;

      Logger.balance(`TRX Balance for ${address}`, {
        balance: balanceInTRX,
        network: this.networkConfig.name,
      });

      return {
        success: true,
        balance: balanceInTRX.toString(),
        balanceRaw: balance.toString(),
        address: address,
        network: this.networkConfig.name,
      };
    } catch (error) {
      Logger.error('Error getting TRX balance', error);
      return handleError(error);
    }
  }

  async getUSDTBalance(address: string): Promise<WalletBalance> {
    try {
      const contractAddress = this.networkConfig.usdtContract;

      if (!this.tronWeb.isAddress(address)) {
        throw new Error('Invalid wallet address');
      }
      if (!this.tronWeb.isAddress(contractAddress)) {
        throw new Error('Invalid USDT contract address');
      }

      Logger.debug('Checking USDT balance', {
        network: this.networkConfig.name,
        contract: contractAddress,
        address: address,
      });

      // Verify contract exists
      try {
        await this.tronWeb.trx.getContract(contractAddress);
      } catch (contractError) {
        throw new Error(`USDT contract does not exist on this network: ${contractAddress}`);
      }

      const contract = await this.tronWeb.contract(TRON_USDT_ABI, contractAddress);

      let balance = 0;

      try {
        const balanceResult = await this.tronWeb.transactionBuilder.triggerConstantContract(
          contractAddress,
          'balanceOf',
          {},
          [{ type: 'address', value: address }],
          address
        );

        if (balanceResult.result && balanceResult.result.result) {
          balance = parseInt(balanceResult.result.result.toString(), 16);
        }
      } catch (error) {
        Logger.debug('First method failed, trying alternative method', error);

        try {
          const balanceResult = await contract.balanceOf(address).call();
          balance = parseInt(balanceResult.toString());
        } catch (altError) {
          Logger.error('Alternative method also failed', altError);
        }
      }

      const balanceFormatted = balance / Math.pow(10, USDT_DECIMALS);

      Logger.balance(`USDT Balance for ${address}`, {
        balance: balanceFormatted,
        decimals: USDT_DECIMALS,
        network: this.networkConfig.name,
      });

      return {
        success: true,
        balance: balanceFormatted.toString(),
        balanceRaw: balance.toString(),
        decimals: USDT_DECIMALS,
        address: address,
        network: this.networkConfig.name,
      };
    } catch (error) {
      Logger.error('Error getting USDT balance', error);
      return handleError(error);
    }
  }

  async transferTRX(
    wallet: TronWallet,
    toAddress: string,
    amountTRX: number
  ): Promise<TransactionResult> {
    try {
      validateAmount(amountTRX);

      this.setPrivateKey(wallet.privateKey);

      if (!this.tronWeb.isAddress(wallet.address)) {
        throw new Error('Invalid source address');
      }
      if (!this.tronWeb.isAddress(toAddress)) {
        throw new Error('Invalid destination address');
      }

      const amountSUN = amountTRX * TRX_TO_SUN;

      // Verify balance
      const balance = await this.tronWeb.trx.getBalance(wallet.address);
      if (balance < amountSUN) {
        throw new InsufficientBalanceError(
          amountTRX.toString(),
          (balance / TRX_TO_SUN).toString(),
          'TRX'
        );
      }

      const transaction = await this.tronWeb.transactionBuilder.sendTrx(
        toAddress,
        amountSUN,
        wallet.address
      );

      const signedTransaction = await this.tronWeb.trx.sign(transaction, wallet.privateKey);
      const result = await this.tronWeb.trx.sendRawTransaction(signedTransaction);

      Logger.success('TRX transfer successful', {
        txID: result.txid,
        amount: amountTRX,
        network: this.networkConfig.name,
      });

      return {
        success: true,
        txID: result.txid,
        transaction: signedTransaction,
        amount: amountTRX,
        network: this.networkConfig.name,
      };
    } catch (error) {
      Logger.error('Error transferring TRX', error);
      return handleError(error);
    }
  }

  async transferUSDT(
    wallet: TronWallet,
    toAddress: string,
    amountUSDT: number
  ): Promise<TransactionResult> {
    try {
      validateAmount(amountUSDT);

      this.setPrivateKey(wallet.privateKey);
      const contractAddress = this.networkConfig.usdtContract;

      if (!this.tronWeb.isAddress(wallet.address)) {
        throw new Error('Invalid source address');
      }
      if (!this.tronWeb.isAddress(toAddress)) {
        throw new Error('Invalid destination address');
      }
      if (!this.tronWeb.isAddress(contractAddress)) {
        throw new Error('Invalid USDT contract address');
      }

      const contract = await this.tronWeb.contract(TRON_USDT_ABI, contractAddress);
      const amountInSmallestUnit = Math.floor(amountUSDT * Math.pow(10, USDT_DECIMALS));

      // Verify USDT balance
      let usdtBalance = 0;
      try {
        const balanceResult = await contract.balanceOf(wallet.address).call();
        usdtBalance = parseInt(balanceResult.toString());
      } catch (error) {
        throw new Error('Could not verify USDT balance');
      }

      if (usdtBalance < amountInSmallestUnit) {
        throw new InsufficientBalanceError(
          amountUSDT.toString(),
          (usdtBalance / Math.pow(10, USDT_DECIMALS)).toString(),
          'USDT'
        );
      }

      // Verify TRX balance for gas
      const trxBalance = await this.tronWeb.trx.getBalance(wallet.address);
      if (trxBalance < MIN_TRX_FOR_GAS) {
        throw new InsufficientBalanceError(
          (MIN_TRX_FOR_GAS / TRX_TO_SUN).toString(),
          (trxBalance / TRX_TO_SUN).toString(),
          'TRX (for gas)'
        );
      }

      Logger.transaction('Creating USDT transfer', {
        from: wallet.address,
        to: toAddress,
        amount: amountUSDT,
      });

      try {
        const txResult = await contract.transfer(toAddress, amountInSmallestUnit).send({
          feeLimit: 100_000_000,
          callValue: 0,
          shouldPollResponse: false,
        });

        const txID = txResult.txid || txResult.id || 'unknown';

        Logger.success('USDT transfer successful', {
          txID: txID,
          amount: amountUSDT,
          network: this.networkConfig.name,
        });

        return {
          success: true,
          txID: txID,
          transaction: txResult,
          amount: amountUSDT,
          amountRaw: amountInSmallestUnit.toString(),
          decimals: USDT_DECIMALS,
          network: this.networkConfig.name,
        };
      } catch (contractError) {
        Logger.warning('First method failed, trying alternative method');

        const functionSelector = 'transfer(address,uint256)';
        const addressHex = this.tronWeb.address.toHex(toAddress).replace('0x', '');
        const amountHex = amountInSmallestUnit.toString(16).padStart(64, '0');
        const parameter = addressHex + amountHex;

        const transaction = await this.tronWeb.transactionBuilder.triggerSmartContract(
          contractAddress,
          functionSelector,
          {},
          [],
          wallet.address
        );

        if (!transaction.result || !transaction.result.result) {
          throw new Error(`Error creating transaction: ${JSON.stringify(transaction)}`);
        }

        const signedTransaction = await this.tronWeb.trx.sign(
          transaction.transaction,
          wallet.privateKey
        );
        const result = await this.tronWeb.trx.sendRawTransaction(signedTransaction);

        if (!result.result) {
          throw new Error(`Error sending transaction: ${JSON.stringify(result)}`);
        }

        Logger.success('USDT transfer successful (alternative method)', {
          txID: result.txid,
          amount: amountUSDT,
          network: this.networkConfig.name,
        });

        return {
          success: true,
          txID: result.txid,
          transaction: signedTransaction,
          amount: amountUSDT,
          amountRaw: amountInSmallestUnit.toString(),
          decimals: USDT_DECIMALS,
          network: this.networkConfig.name,
        };
      }
    } catch (error) {
      Logger.error('Error transferring USDT', error);
      return handleError(error);
    }
  }

  async getTransactionStatus(txID: string): Promise<TransactionStatus> {
    try {
      const txInfo = await this.tronWeb.trx.getTransactionInfo(txID);
      const tx = await this.tronWeb.trx.getTransaction(txID);

      Logger.info('Transaction status', {
        txID,
        confirmed: !!txInfo.blockNumber,
        blockNumber: txInfo.blockNumber,
      });

      return {
        txID: txID,
        confirmed: !!txInfo.blockNumber,
        blockNumber: txInfo.blockNumber,
        energyUsed: txInfo.receipt?.energy_usage_total || 0,
        netUsed: txInfo.receipt?.net_usage || 0,
        network: this.networkConfig.name,
      };
    } catch (error) {
      Logger.error('Error getting transaction status', error);
      return {
        txID: txID,
        confirmed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        network: this.networkConfig.name,
      };
    }
  }
}
