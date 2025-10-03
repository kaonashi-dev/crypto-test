import { ethers } from 'ethers';
import type {
  EthereumWallet,
  WalletBalance,
  TransactionResult,
  TransactionStatus,
} from '../types/wallet.types.ts';
import type { NetworkType } from '../types/network.types.ts';
import { ETHEREUM_NETWORKS, USDT_ABI } from '../config/ethereum.config.ts';
import {
  validateEthereumAddress,
  validateAmount,
  validateRpcUrl,
} from '../utils/validation.utils.ts';
import { InsufficientBalanceError, handleError } from '../utils/error.utils.ts';
import { Logger } from '../utils/logger.utils.ts';

export class EthereumService {
  private provider: ethers.JsonRpcProvider;
  private networkConfig: typeof ETHEREUM_NETWORKS[NetworkType];

  constructor(network: NetworkType = 'public') {
    this.networkConfig = ETHEREUM_NETWORKS[network];
    validateRpcUrl(this.networkConfig.rpcUrl, this.networkConfig.name);

    Logger.network(`Connecting to ${this.networkConfig.name}`, this.networkConfig.rpcUrl);
    this.provider = new ethers.JsonRpcProvider(this.networkConfig.rpcUrl);
  }

  createWallet(privateKey?: string): EthereumWallet {
    try {
      let wallet: ethers.Wallet;

      if (privateKey && privateKey !== '0') {
        wallet = new ethers.Wallet(privateKey);
      } else {
        wallet = ethers.Wallet.createRandom();
      }

      const publicKey = (wallet as any).publicKey || undefined;

      const walletData: EthereumWallet = {
        privateKey: wallet.privateKey,
        publicKey: publicKey,
        address: wallet.address,
      };

      Logger.success('Wallet created', {
        address: walletData.address,
        network: this.networkConfig.name,
      });

      return walletData;
    } catch (error) {
      Logger.error('Error creating wallet', error);
      throw error;
    }
  }

  async getETHBalance(address: string): Promise<WalletBalance> {
    try {
      const validAddress = validateEthereumAddress(address);
      const balance = await this.provider.getBalance(validAddress);
      const balanceInETH = ethers.formatEther(balance);

      Logger.balance(`ETH Balance for ${validAddress}`, {
        balance: balanceInETH,
        network: this.networkConfig.name,
      });

      return {
        success: true,
        balance: balanceInETH,
        balanceRaw: balance.toString(),
        address: validAddress,
        network: this.networkConfig.name,
      };
    } catch (error) {
      Logger.error('Error getting ETH balance', error);
      return handleError(error);
    }
  }

  async getUSDTBalance(address: string): Promise<WalletBalance> {
    try {
      const validAddress = validateEthereumAddress(address);
      const contractAddress = validateEthereumAddress(this.networkConfig.usdtContract);

      const contract = new ethers.Contract(contractAddress, USDT_ABI, this.provider);

      const balance = (await (contract.balanceOf as any)(validAddress)) as bigint;
      const decimals = (await (contract.decimals as any)()) as number;
      const balanceFormatted = ethers.formatUnits(balance, decimals);

      Logger.balance(`USDT Balance for ${validAddress}`, {
        balance: balanceFormatted,
        decimals,
        network: this.networkConfig.name,
      });

      return {
        success: true,
        balance: balanceFormatted,
        balanceRaw: balance.toString(),
        decimals: decimals,
        address: validAddress,
        network: this.networkConfig.name,
      };
    } catch (error) {
      Logger.error('Error getting USDT balance', error);
      return handleError(error);
    }
  }

  async transferETH(
    wallet: EthereumWallet,
    toAddress: string,
    amountETH: number
  ): Promise<TransactionResult> {
    try {
      validateAmount(amountETH);
      const validToAddress = validateEthereumAddress(toAddress);
      const walletInstance = new ethers.Wallet(wallet.privateKey, this.provider);

      const amountWei = ethers.parseEther(amountETH.toString());

      // Verify sufficient balance
      const balance = await this.provider.getBalance(wallet.address);
      if (balance < amountWei) {
        throw new InsufficientBalanceError(
          amountETH.toString(),
          ethers.formatEther(balance),
          'ETH'
        );
      }

      const transaction = {
        to: validToAddress,
        value: amountWei,
        gasLimit: 21000,
      };

      const feeData = await this.provider.getFeeData();
      if (feeData.gasPrice) {
        (transaction as any).gasPrice = feeData.gasPrice;
      }

      const txResponse = await walletInstance.sendTransaction(transaction);
      Logger.transaction('Transaction sent', txResponse.hash);

      const receipt = await txResponse.wait();

      Logger.success('ETH transfer successful', {
        txHash: receipt?.hash,
        amount: amountETH,
        network: this.networkConfig.name,
      });

      return {
        success: true,
        txHash: receipt?.hash,
        transaction: txResponse,
        receipt: receipt,
        amount: amountETH,
        network: this.networkConfig.name,
      };
    } catch (error) {
      Logger.error('Error transferring ETH', error);
      return handleError(error);
    }
  }

  async transferUSDT(
    wallet: EthereumWallet,
    toAddress: string,
    amountUSDT: number
  ): Promise<TransactionResult> {
    try {
      validateAmount(amountUSDT);
      const validToAddress = validateEthereumAddress(toAddress);
      const contractAddress = validateEthereumAddress(this.networkConfig.usdtContract);

      const walletInstance = new ethers.Wallet(wallet.privateKey, this.provider);
      const contract = new ethers.Contract(contractAddress, USDT_ABI, walletInstance);

      const decimals = (await (contract.decimals as any)()) as number;
      const amountInSmallestUnit = ethers.parseUnits(amountUSDT.toString(), decimals);

      // Verify USDT balance
      const usdtBalance = (await (contract.balanceOf as any)(wallet.address)) as bigint;
      if (usdtBalance < amountInSmallestUnit) {
        throw new InsufficientBalanceError(
          amountUSDT.toString(),
          ethers.formatUnits(usdtBalance, decimals),
          'USDT'
        );
      }

      // Verify ETH balance for gas
      const ethBalance = await this.provider.getBalance(wallet.address);
      const minEthForGas = ethers.parseEther('0.01');
      if (ethBalance < minEthForGas) {
        throw new InsufficientBalanceError(
          '0.01',
          ethers.formatEther(ethBalance),
          'ETH (for gas)'
        );
      }

      Logger.transaction('Creating USDT transfer', {
        from: wallet.address,
        to: validToAddress,
        amount: amountUSDT,
      });

      const txResponse = (await (contract.transfer as any)(
        validToAddress,
        amountInSmallestUnit
      )) as ethers.ContractTransactionResponse;

      Logger.transaction('Transaction sent', txResponse.hash);

      const receipt = await txResponse.wait();

      Logger.success('USDT transfer successful', {
        txHash: receipt?.hash,
        amount: amountUSDT,
        network: this.networkConfig.name,
      });

      return {
        success: true,
        txHash: receipt?.hash,
        transaction: txResponse,
        receipt: receipt,
        amount: amountUSDT,
        amountRaw: amountInSmallestUnit.toString(),
        decimals: decimals,
        network: this.networkConfig.name,
      };
    } catch (error) {
      Logger.error('Error transferring USDT', error);
      return handleError(error);
    }
  }

  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.provider.getTransactionReceipt(txHash),
      ]);

      if (!tx) {
        return {
          txHash: txHash,
          confirmed: false,
          error: 'Transaction not found',
          network: this.networkConfig.name,
        };
      }

      Logger.info('Transaction status', {
        txHash,
        confirmed: !!receipt,
        blockNumber: receipt?.blockNumber,
        status: receipt?.status,
      });

      return {
        txHash: txHash,
        confirmed: !!receipt,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
        status: receipt?.status,
        network: this.networkConfig.name,
      };
    } catch (error) {
      Logger.error('Error getting transaction status', error);
      return {
        txHash: txHash,
        confirmed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        network: this.networkConfig.name,
      };
    }
  }

  async getNetworkInfo() {
    try {
      const [blockNumber, feeData, chainId] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getFeeData(),
        this.provider.getNetwork(),
      ]);

      return {
        name: this.networkConfig.name,
        chainId: chainId.chainId,
        blockNumber: blockNumber,
        gasPrice: feeData.gasPrice?.toString() || '0',
        rpcUrl: this.networkConfig.rpcUrl,
        usdtContract: this.networkConfig.usdtContract,
      };
    } catch (error) {
      Logger.error('Error getting network info', error);
      return handleError(error);
    }
  }

  async estimateGas(fromAddress: string, toAddress: string, amountETH: number) {
    try {
      const validToAddress = validateEthereumAddress(toAddress);
      const amountWei = ethers.parseEther(amountETH.toString());

      const gasEstimate = await this.provider.estimateGas({
        from: fromAddress,
        to: validToAddress,
        value: amountWei,
      });

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      const totalCost = gasEstimate * gasPrice;

      return {
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
        totalCost: ethers.formatEther(totalCost),
        totalCostWei: totalCost.toString(),
      };
    } catch (error) {
      Logger.error('Error estimating gas', error);
      return handleError(error);
    }
  }
}
