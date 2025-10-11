import { ethers } from 'ethers';
import { 
  BlockchainProvider
} from './blockchainProvider';
import type { 
  TransactionRequest, 
  ProviderTransactionResult, 
  ProviderStatusResult,
  TransactionDetails,
  AddressTransactionsResult
} from './blockchainProvider';

interface EthereumConfig {
  apiKey?: string;
  apiUrl?: string;
  isTestnet?: boolean;
}

export class EthereumProvider extends BlockchainProvider {
  private provider: ethers.JsonRpcProvider;
  private isTestnet: boolean;
  
  // USDT Contract addresses
  private readonly USDT_CONTRACT_MAINNET = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
  private readonly USDT_CONTRACT_SEPOLIA = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06'; // Example testnet USDT
  
  // USDT ABI for ERC20 operations
  private readonly USDT_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 value) returns (bool)',
    'function transferFrom(address from, address to, uint256 value) returns (bool)',
    'function approve(address spender, uint256 value) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ];

  constructor(config?: EthereumConfig) {
    console.log('🔍 EthereumProvider constructor:', {
      config
    });
    
    // Default to Sepolia testnet for safety
    const defaultUrl = config?.isTestnet !== false ? 
      'https://sepolia.infura.io/v3/' : 
      'https://mainnet.infura.io/v3/';
    
    const apiUrl = config?.apiUrl || (config?.apiKey ? `${defaultUrl}${config.apiKey}` : defaultUrl);
    
    super('ETHEREUM', config?.apiKey, apiUrl);
    
    this.isTestnet = config?.isTestnet !== false; // Default to testnet for safety
    
    this.provider = new ethers.JsonRpcProvider(this.apiUrl);
    
    console.log('🔍 EthereumProvider constructor after super:', {
      apiUrl,
      isTestnet: this.isTestnet
    });
  }

  async createWallet(): Promise<{ address: string; privateKey: string; publicKey: string }> {
    try {
      const wallet = ethers.Wallet.createRandom();
      
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey
      };
    } catch (error) {
      console.error('Error creating Ethereum wallet:', error);
      throw new Error(`Failed to create Ethereum wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendTransaction(request: TransactionRequest): Promise<ProviderTransactionResult> {
    try {
      if (!request.privateKey) {
        throw new Error('Private key is required for Ethereum transactions');
      }

      // Create wallet from private key
      const wallet = new ethers.Wallet(request.privateKey, this.provider);

      // Validate addresses
      if (!this.validateAddress(request.fromAddress)) {
        throw new Error('Invalid from address');
      }
      if (!this.validateAddress(request.toAddress)) {
        throw new Error('Invalid to address');
      }

      // Verify the wallet address matches the from address
      if (wallet.address.toLowerCase() !== request.fromAddress.toLowerCase()) {
        throw new Error('Private key does not match from address');
      }

      let result: ethers.TransactionResponse;

      if (request.coin === 'ETH') {
        result = await this.sendETH(wallet, request);
      } else if (request.coin === 'USDT') {
        result = await this.sendUSDT(wallet, request);
      } else {
        throw new Error(`Unsupported coin: ${request.coin} on Ethereum network`);
      }

      return {
        success: true,
        txHash: result.hash,
        status: 'pending'
      };

    } catch (error) {
      console.error('Ethereum transaction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendETH(wallet: ethers.Wallet, request: TransactionRequest): Promise<ethers.TransactionResponse> {
    const amountWei = ethers.parseEther(request.amount);

    // Check balance
    const balance = await this.provider.getBalance(wallet.address);
    if (balance < amountWei) {
      throw new Error(`Insufficient ETH balance. Required: ${request.amount} ETH, Available: ${ethers.formatEther(balance)} ETH`);
    }

    // Get gas price and estimate gas limit
    const gasPrice = request.gasPrice ? ethers.parseUnits(request.gasPrice, 'gwei') : await this.provider.getFeeData().then(fee => fee.gasPrice);
    const gasLimit = request.gasLimit ? BigInt(request.gasLimit) : 21000n; // Standard ETH transfer gas limit

    // Check if we have enough balance for gas fees
    const gasCost = gasPrice! * gasLimit;
    if (balance < amountWei + gasCost) {
      throw new Error(`Insufficient ETH balance for transaction + gas fees. Required: ${ethers.formatEther(amountWei + gasCost)} ETH, Available: ${ethers.formatEther(balance)} ETH`);
    }

    // Create and send transaction
    const tx = {
      to: request.toAddress,
      value: amountWei,
      gasLimit: gasLimit,
      gasPrice: gasPrice
    };

    return await wallet.sendTransaction(tx);
  }

  private async sendUSDT(wallet: ethers.Wallet, request: TransactionRequest): Promise<ethers.TransactionResponse> {
    const contractAddress = this.isTestnet ? this.USDT_CONTRACT_SEPOLIA : this.USDT_CONTRACT_MAINNET;
    const decimals = 6; // USDT uses 6 decimals
    const amountInSmallestUnit = ethers.parseUnits(request.amount, decimals);

    // Get contract instance
    const contract = new ethers.Contract(contractAddress, this.USDT_ABI, wallet);

    // Check USDT balance
    const usdtBalance = await this.getUSDTBalance(request.fromAddress);
    if (usdtBalance < parseFloat(request.amount)) {
      throw new Error(`Insufficient USDT balance. Required: ${request.amount} USDT, Available: ${usdtBalance} USDT`);
    }

    // Check ETH balance for gas
    const ethBalance = await this.provider.getBalance(wallet.address);
    const estimatedGas = await contract.transfer.estimateGas(request.toAddress, amountInSmallestUnit);
    const gasPrice = await this.provider.getFeeData().then(fee => fee.gasPrice);
    const estimatedGasCost = estimatedGas * gasPrice!;

    if (ethBalance < estimatedGasCost) {
      const requiredEth = ethers.formatEther(estimatedGasCost);
      const availableEth = ethers.formatEther(ethBalance);
      throw new Error(`Insufficient ETH for gas fees. Required: ${requiredEth} ETH, Available: ${availableEth} ETH`);
    }

    // Send USDT using contract
    return await contract.transfer(request.toAddress, amountInSmallestUnit);
  }

  async getTransactionStatus(txHash: string): Promise<ProviderStatusResult> {
    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.provider.getTransactionReceipt(txHash)
      ]);

      let status: 'pending' | 'confirmed' | 'failed' = 'pending';
      
      if (receipt) {
        status = receipt.status === 1 ? 'confirmed' : 'failed';
      }

      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = receipt ? currentBlock - receipt.blockNumber + 1 : 0;

      return {
        status,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
        gasPrice: tx?.gasPrice?.toString(),
        confirmations
      };

    } catch (error) {
      console.error('Error getting Ethereum transaction status:', error);
      return {
        status: 'pending'
      };
    }
  }

  async getWalletBalance(address: string, coin?: string): Promise<number> {
    try {
      if (!this.validateAddress(address)) {
        console.error(`❌ Invalid Ethereum address format: ${address}`);
        throw new Error(`Invalid Ethereum address: ${address}`);
      }

      if (!coin || coin === 'ETH') {
        return await this.getETHBalance(address);
      } else if (coin === 'USDT') {
        return await this.getUSDTBalance(address);
      } else {
        throw new Error(`Unsupported coin: ${coin} on Ethereum network`);
      }

    } catch (error) {
      console.error(`Error getting Ethereum wallet balance for ${address}:`, error);
      return 0;
    }
  }

  private async getETHBalance(address: string): Promise<number> {
    const balanceWei = await this.provider.getBalance(address);
    return parseFloat(ethers.formatEther(balanceWei));
  }

  private async getUSDTBalance(address: string): Promise<number> {
    try {
      const contractAddress = this.isTestnet ? this.USDT_CONTRACT_SEPOLIA : this.USDT_CONTRACT_MAINNET;
      const contract = new ethers.Contract(contractAddress, this.USDT_ABI, this.provider);
      
      const balance = await contract.balanceOf(address);
      return parseFloat(ethers.formatUnits(balance, 6)); // USDT uses 6 decimals
    } catch (error) {
      console.error('Error getting USDT balance:', error);
      return 0;
    }
  }

  validateAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  async estimateFee(request: Omit<TransactionRequest, 'privateKey'>): Promise<string> {
    try {
      if (request.coin === 'ETH') {
        const gasPrice = await this.provider.getFeeData().then(fee => fee.gasPrice);
        const gasLimit = 21000n; // Standard ETH transfer
        const gasCost = gasPrice! * gasLimit;
        return ethers.formatEther(gasCost);
      } else if (request.coin === 'USDT') {
        const contractAddress = this.isTestnet ? this.USDT_CONTRACT_SEPOLIA : this.USDT_CONTRACT_MAINNET;
        const contract = new ethers.Contract(contractAddress, this.USDT_ABI, this.provider);
        
        try {
          const estimatedGas = await contract.transfer.estimateGas(
            request.toAddress, 
            ethers.parseUnits(request.amount, 6)
          );
          const gasPrice = await this.provider.getFeeData().then(fee => fee.gasPrice);
          const gasCost = estimatedGas * gasPrice!;
          return ethers.formatEther(gasCost);
        } catch (error) {
          // Fallback estimate for USDT transfers
          return '0.01';
        }
      } else {
        return '0.005'; // Default estimate
      }
    } catch (error) {
      console.error('Error estimating Ethereum fee:', error);
      return '0.005';
    }
  }

  override getExplorerUrl(txHash: string): string {
    const baseUrl = this.isTestnet ? 'https://sepolia.etherscan.io' : 'https://etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
  }

  // Additional Ethereum-specific methods
  getIsTestnet(): boolean {
    return this.isTestnet;
  }

  getUSDTContractAddress(): string {
    return this.isTestnet ? this.USDT_CONTRACT_SEPOLIA : this.USDT_CONTRACT_MAINNET;
  }

  async getTransactionDetails(txHash: string, coin?: string): Promise<TransactionDetails> {
    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.provider.getTransactionReceipt(txHash)
      ]);

      if (!tx) {
        throw new Error('Transaction not found');
      }

      // Determine status
      let status: 'pending' | 'confirmed' | 'failed' = 'pending';
      if (receipt) {
        status = receipt.status === 1 ? 'confirmed' : 'failed';
      }

      let fromAddress = tx.from;
      let toAddress = tx.to || '';
      let amount = '0';
      let detectedCoin = coin || 'ETH';

      // Check if this is a contract interaction (USDT transfer)
      if (tx.to && (
        tx.to.toLowerCase() === this.USDT_CONTRACT_MAINNET.toLowerCase() ||
        tx.to.toLowerCase() === this.USDT_CONTRACT_SEPOLIA.toLowerCase()
      )) {
        // This is likely a USDT transfer
        detectedCoin = 'USDT';
        
        if (receipt && receipt.logs.length > 0) {
          // Parse Transfer event logs
          const transferInterface = new ethers.Interface(this.USDT_ABI);
          
          for (const log of receipt.logs) {
            try {
              const parsedLog = transferInterface.parseLog(log);
              if (parsedLog?.name === 'Transfer') {
                fromAddress = parsedLog.args[0];
                toAddress = parsedLog.args[1];
                amount = ethers.formatUnits(parsedLog.args[2], 6); // USDT uses 6 decimals
                break;
              }
            } catch (error) {
              // Log parsing failed, continue
            }
          }
        }
        
        // Fallback: try to decode transaction data
        if (amount === '0' && tx.data.length >= 138) {
          try {
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
              ['address', 'uint256'],
              '0x' + tx.data.slice(10) // Remove function selector
            );
            toAddress = decoded[0];
            amount = ethers.formatUnits(decoded[1], 6);
          } catch (error) {
            // Decoding failed
          }
        }
      } else {
        // Regular ETH transfer
        amount = ethers.formatEther(tx.value);
        detectedCoin = 'ETH';
      }

      // Calculate fee
      let fee = '0';
      if (receipt && tx.gasPrice) {
        const gasCost = receipt.gasUsed * tx.gasPrice;
        fee = ethers.formatEther(gasCost);
      }

      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = receipt ? currentBlock - receipt.blockNumber + 1 : 0;

      return {
        txHash,
        fromAddress,
        toAddress,
        amount,
        coin: detectedCoin,
        network: 'ETHEREUM',
        status,
        blockNumber: receipt?.blockNumber,
        blockHash: receipt?.blockHash,
        gasUsed: receipt?.gasUsed?.toString(),
        gasPrice: tx.gasPrice?.toString(),
        fee,
        confirmations,
        timestamp: receipt ? (await this.provider.getBlock(receipt.blockNumber))?.timestamp : undefined,
        explorerUrl: this.getExplorerUrl(txHash)
      };

    } catch (error) {
      console.error('Error getting Ethereum transaction details:', error);
      throw new Error(`Failed to get transaction details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAddressTransactions(address: string, coin?: string, page: number = 1, limit: number = 10): Promise<AddressTransactionsResult> {
    console.log('🔍 Fetching transactions for address:', {
      address,
      coin,
      page,
      limit
    });

    try {
      if (!this.validateAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      const transactions: TransactionDetails[] = [];
      
      // Note: This is a simplified implementation using the provider's transaction history
      // In a production environment, you would use services like Etherscan API, Alchemy, or Moralis
      
      // Get ETH transactions if no coin specified or coin is ETH
      if (!coin || coin === 'ETH') {
        const ethTxs = await this.getETHTransactions(address, page, limit);
        transactions.push(...ethTxs);
      }

      // Get USDT transactions if no coin specified or coin is USDT
      if (!coin || coin === 'USDT') {
        const usdtTxs = await this.getUSDTTransactions(address, page, limit);
        transactions.push(...usdtTxs);
      }

      // Sort by timestamp (most recent first)
      transactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      // Apply pagination if getting all transactions
      const startIndex = (page - 1) * limit;
      const paginatedTransactions = coin ? transactions : transactions.slice(startIndex, startIndex + limit);

      return {
        transactions: paginatedTransactions,
        total: transactions.length,
        page,
        limit
      };

    } catch (error) {
      console.error('Error getting Ethereum address transactions:', error);
      throw new Error(`Failed to get address transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getETHTransactions(address: string, page: number, limit: number): Promise<TransactionDetails[]> {
    try {
      // This is a basic implementation. In production, you would use Etherscan API or similar
      // For now, we'll return an empty array as we don't have a transaction indexing service
      
      console.log('⚠️ ETH transaction history requires external API service (Etherscan, Alchemy, etc.)');
      return [];
    } catch (error) {
      console.error('Error getting ETH transactions:', error);
      return [];
    }
  }

  private async getUSDTTransactions(address: string, page: number, limit: number): Promise<TransactionDetails[]> {
    try {
      // This is a basic implementation. In production, you would use Etherscan API or similar
      // For now, we'll return an empty array as we don't have a transaction indexing service
      
      console.log('⚠️ USDT transaction history requires external API service (Etherscan, Alchemy, etc.)');
      return [];
    } catch (error) {
      console.error('Error getting USDT transactions:', error);
      return [];
    }
  }
}