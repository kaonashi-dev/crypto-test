import { TronWeb } from 'tronweb';
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

interface TronWallet {
  privateKey: string;
  publicKey: string;
  address: {
    base58: string;
    hex: string;
  };
}

interface TronConfig {
  apiKey?: string;
  apiUrl?: string;
  isTestnet?: boolean;
}

export class TronProvider extends BlockchainProvider {
  private tronWeb: TronWeb;
  private isTestnet: boolean;
  
  // USDT Contract addresses
  private readonly USDT_CONTRACT_MAINNET = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
  private readonly USDT_CONTRACT_TESTNET = 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf';
  
  // USDT ABI for TRC20 operations
  private readonly USDT_ABI = [
    {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [{"name": "", "type": "string"}],
      "type": "function",
      "stateMutability": "view"
    },
    {
      "constant": false,
      "inputs": [
        {"name": "_spender", "type": "address"},
        {"name": "_value", "type": "uint256"}
      ],
      "name": "approve",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function",
      "stateMutability": "nonpayable"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function",
      "stateMutability": "view"
    },
    {
      "constant": false,
      "inputs": [
        {"name": "_from", "type": "address"},
        {"name": "_to", "type": "address"},
        {"name": "_value", "type": "uint256"}
      ],
      "name": "transferFrom",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function",
      "stateMutability": "nonpayable"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [{"name": "", "type": "uint8"}],
      "type": "function",
      "stateMutability": "view"
    },
    {
      "constant": true,
      "inputs": [{"name": "_owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "balance", "type": "uint256"}],
      "type": "function",
      "stateMutability": "view"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [{"name": "", "type": "string"}],
      "type": "function",
      "stateMutability": "view"
    },
    {
      "constant": false,
      "inputs": [
        {"name": "_to", "type": "address"},
        {"name": "_value", "type": "uint256"}
      ],
      "name": "transfer",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function",
      "stateMutability": "nonpayable"
    },
    {
      "constant": true,
      "inputs": [
        {"name": "_owner", "type": "address"},
        {"name": "_spender", "type": "address"}
      ],
      "name": "allowance",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function",
      "stateMutability": "view"
    }
  ];

  constructor(config?: TronConfig) {
    console.log('🔍 TronProvider constructor:', {
      config
    });
    // const apiUrl = config?.apiUrl || (config?.isTestnet ? 'https://nile.trongrid.io' : 'https://api.trongrid.io');
    const apiUrl = 'https://nile.trongrid.io';
    super('TRON', config?.apiKey, apiUrl);
    
    this.isTestnet = config?.isTestnet ?? true; // Default to testnet for safety
    
    this.tronWeb = new TronWeb({
      fullHost: this.apiUrl,
      headers: config?.apiKey ? { 'TRON-PRO-API-KEY': config.apiKey } : {}
    });
    console.log('🔍 TronProvider constructor after super:', {
      apiUrl
    });
  }

  async createWallet(): Promise<{ address: string; privateKey: string; publicKey: string }> {
    try {
      const wallet = await this.tronWeb.createAccount() as TronWallet;
      
      return {
        address: wallet.address.base58,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey
      };
    } catch (error) {
      console.error('Error creating Tron wallet:', error);
      throw new Error(`Failed to create Tron wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendTransaction(request: TransactionRequest): Promise<ProviderTransactionResult> {
    try {
      if (!request.privateKey) {
        throw new Error('Private key is required for Tron transactions');
      }

      // Set private key for signing
      this.tronWeb.setPrivateKey(request.privateKey);

      // Validate addresses
      if (!this.validateAddress(request.fromAddress)) {
        throw new Error('Invalid from address');
      }
      if (!this.validateAddress(request.toAddress)) {
        throw new Error('Invalid to address');
      }

      let result: any;

      if (request.coin === 'TRX') {
        result = await this.sendTRX(request);
      } else if (request.coin === 'USDT') {
        result = await this.sendUSDT(request);
      } else {
        throw new Error(`Unsupported coin: ${request.coin} on Tron network`);
      }

      return {
        success: true,
        txHash: result.txID || result.txid,
        status: 'pending'
      };

    } catch (error) {
      console.error('Tron transaction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendTRX(request: TransactionRequest): Promise<any> {
    const amountSUN = parseFloat(request.amount) * 1_000_000; // Convert TRX to SUN

    // Check balance
    const balance = await this.tronWeb.trx.getBalance(request.fromAddress);
    if (balance < amountSUN) {
      throw new Error(`Insufficient TRX balance. Required: ${request.amount} TRX, Available: ${balance / 1_000_000} TRX`);
    }

    // Create transaction
    const transaction = await this.tronWeb.transactionBuilder.sendTrx(
      request.toAddress,
      amountSUN,
      request.fromAddress
    );

    // Sign transaction
    const signedTransaction = await this.tronWeb.trx.sign(transaction, request.privateKey);

    // Send transaction
    const result = await this.tronWeb.trx.sendRawTransaction(signedTransaction);

    if (!result.result) {
      throw new Error(`Transaction failed: ${JSON.stringify(result)}`);
    }

    return result;
  }

  private async sendUSDT(request: TransactionRequest): Promise<any> {
    const contractAddress = this.isTestnet ? this.USDT_CONTRACT_TESTNET : this.USDT_CONTRACT_MAINNET;
    const decimals = 6; // USDT uses 6 decimals
    const amountInSmallestUnit = Math.floor(parseFloat(request.amount) * Math.pow(10, decimals));

    // Get contract instance
    const contract = await this.tronWeb.contract(this.USDT_ABI, contractAddress);

    // Check USDT balance
    const usdtBalance = await this.getUSDTBalance(request.fromAddress);
    if (usdtBalance < parseFloat(request.amount)) {
      throw new Error(`Insufficient USDT balance. Required: ${request.amount} USDT, Available: ${usdtBalance} USDT`);
    }

    // Check TRX balance for gas
    const trxBalance = await this.tronWeb.trx.getBalance(request.fromAddress);
    const minTrxForGas = 15 * 1_000_000; // 15 TRX minimum for gas
    if (trxBalance < minTrxForGas) {
      throw new Error(`Insufficient TRX for gas fees. Required: 15 TRX, Available: ${trxBalance / 1_000_000} TRX`);
    }

    // Send USDT using contract
    const txResult = await contract.transfer(
      request.toAddress,
      amountInSmallestUnit
    ).send({
      feeLimit: 100_000_000, // 100 TRX as fee limit
      callValue: 0,
      shouldPollResponse: false
    });

    return txResult;
  }

  async getTransactionStatus(txHash: string): Promise<ProviderStatusResult> {
    try {
      const txInfo = await this.tronWeb.trx.getTransactionInfo(txHash);
      const tx = await this.tronWeb.trx.getTransaction(txHash);

      let status: 'pending' | 'confirmed' | 'failed' = 'pending';
      
      if (txInfo.blockNumber) {
        // Transaction is confirmed if it has a block number
        status = txInfo.result === 'SUCCESS' ? 'confirmed' : 'failed';
      }

      return {
        status,
        blockNumber: txInfo.blockNumber,
        gasUsed: txInfo.receipt?.energy_usage_total?.toString(),
        confirmations: txInfo.blockNumber ? 1 : 0 // Simplified confirmation count
      };

    } catch (error) {
      console.error('Error getting Tron transaction status:', error);
      return {
        status: 'pending'
      };
    }
  }

  async getWalletBalance(address: string, coin?: string): Promise<number> {
    try {
      if (!this.validateAddress(address)) {
        console.error(`❌ Invalid Tron address format: ${address}`);
        throw new Error(`Invalid Tron address: ${address}`);
      }

      if (!coin || coin === 'TRX') {
        return await this.getTRXBalance(address);
      } else if (coin === 'USDT') {
        return await this.getUSDTBalance(address);
      } else {
        throw new Error(`Unsupported coin: ${coin} on Tron network`);
      }

    } catch (error) {
      console.error(`Error getting Tron wallet balance for ${address}:`, error);
      return 0;
    }
  }

  private async getTRXBalance(address: string): Promise<number> {
    const balanceSUN = await this.tronWeb.trx.getBalance(address);
    return balanceSUN / 1_000_000; // Convert SUN to TRX
  }

  private async getUSDTBalance(address: string): Promise<number> {
    try {
      const contractAddress = this.isTestnet ? this.USDT_CONTRACT_TESTNET : this.USDT_CONTRACT_MAINNET;
      const contract = await this.tronWeb.contract(this.USDT_ABI, contractAddress);
      
      // Set the owner address for the contract call
      const balanceResult = await contract.balanceOf(address).call({
        from: address
      });
      const balance = parseInt(balanceResult.toString());
      
      return balance / Math.pow(10, 6); // USDT uses 6 decimals
    } catch (error) {
      console.error('Error getting USDT balance:', error);
      return 0;
    }
  }

  validateAddress(address: string): boolean {
    try {
      return this.tronWeb.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  async estimateFee(request: Omit<TransactionRequest, 'privateKey'>): Promise<string> {
    try {
      if (request.coin === 'TRX') {
        // TRX transfers typically cost around 0.1 TRX
        return '0.1';
      } else if (request.coin === 'USDT') {
        // USDT transfers cost more energy, typically 15-20 TRX
        return '15';
      } else {
        return '1'; // Default estimate
      }
    } catch (error) {
      console.error('Error estimating Tron fee:', error);
      return '1';
    }
  }

  override getExplorerUrl(txHash: string): string {
    const baseUrl = this.isTestnet ? 'https://nile.tronscan.org' : 'https://tronscan.org';
    return `${baseUrl}/#/transaction/${txHash}`;
  }

  // Additional Tron-specific methods
  getIsTestnet(): boolean {
    return this.isTestnet;
  }

  getUSDTContractAddress(): string {
    return this.isTestnet ? this.USDT_CONTRACT_TESTNET : this.USDT_CONTRACT_MAINNET;
  }

  async getTransactionDetails(txHash: string, coin?: string): Promise<TransactionDetails> {
    try {
      // Get transaction info and transaction data
      const [txInfo, tx] = await Promise.all([
        this.tronWeb.trx.getTransactionInfo(txHash),
        this.tronWeb.trx.getTransaction(txHash)
      ]);

      if (!tx) {
        throw new Error('Transaction not found');
      }

      // Determine status
      let status: 'pending' | 'confirmed' | 'failed' = 'pending';
      if (txInfo.blockNumber) {
        status = txInfo.result === 'SUCCESS' ? 'confirmed' : 'failed';
      }

      // Extract transaction details based on coin type
      let fromAddress = '';
      let toAddress = '';
      let amount = '0';
      let detectedCoin = coin || 'TRX';

      if (tx.raw_data?.contract && tx.raw_data.contract.length > 0) {
        const contract = tx.raw_data.contract[0];
        
        if (contract.type === 'TransferContract') {
          // TRX transfer
          fromAddress = this.tronWeb.address.fromHex(contract.parameter.value.owner_address);
          toAddress = this.tronWeb.address.fromHex(contract.parameter.value.to_address);
          amount = (contract.parameter.value.amount / 1_000_000).toString(); // Convert SUN to TRX
          detectedCoin = 'TRX';
        } else if (contract.type === 'TriggerSmartContract') {
          // Smart contract interaction (likely USDT)
          const contractAddress = this.tronWeb.address.fromHex(contract.parameter.value.contract_address);
          fromAddress = this.tronWeb.address.fromHex(contract.parameter.value.owner_address);
          
          // Decode USDT transfer data
          if (contractAddress === this.getUSDTContractAddress()) {
            const data = contract.parameter.value.data;
            if (data && data.startsWith('a9059cbb')) { // transfer function signature
              // Extract to address and amount from data
              const toAddressHex = '41' + data.substring(32, 72); // Add '41' prefix for Tron
              toAddress = this.tronWeb.address.fromHex(toAddressHex);
              const amountHex = data.substring(72, 136);
              const amountBigInt = BigInt('0x' + amountHex);
              amount = (Number(amountBigInt) / Math.pow(10, 6)).toString(); // USDT has 6 decimals
              detectedCoin = 'USDT';
            }
          }
        }
      }

      // Calculate fee from transaction info
      let fee = '0';
      if (txInfo.fee) {
        fee = (txInfo.fee / 1_000_000).toString(); // Convert SUN to TRX
      }

      return {
        txHash,
        fromAddress,
        toAddress,
        amount,
        coin: detectedCoin,
        network: 'TRON',
        status,
        blockNumber: txInfo.blockNumber,
        blockHash: txInfo.blockHash,
        gasUsed: txInfo.receipt?.energy_usage_total?.toString(),
        fee,
        confirmations: txInfo.blockNumber ? 1 : 0,
        timestamp: txInfo.blockTimeStamp,
        explorerUrl: this.getExplorerUrl(txHash)
      };

    } catch (error) {
      console.error('Error getting Tron transaction details:', error);
      throw new Error(`Failed to get transaction details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAddressTransactions(address: string, coin?: string, page: number = 1, limit: number = 10): Promise<AddressTransactionsResult> {
    
    console.log('🔍 Fetching transactions for address:', {
      address,
      coin,
      isTestnet: this.isTestnet,
      network: 'TRON',
      page,
      limit
    });

    try {
      if (!this.validateAddress(address)) {
        throw new Error('Invalid Tron address');
      }

      const transactions: TransactionDetails[] = [];
      
      // Get TRX transactions if no coin specified or coin is TRX
      if (!coin || coin === 'TRX') {
        const trxTxs = await this.getTRXTransactions(address, page, limit);
        transactions.push(...trxTxs);
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
      console.error('Error getting Tron address transactions:', error);
      throw new Error(`Failed to get address transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getTRXTransactions(address: string, page: number, limit: number): Promise<TransactionDetails[]> {
    try {
      // Get account transactions from TronGrid API
      const response = await fetch(
        `${this.apiUrl}/v1/accounts/${address}/transactions?limit=${limit}&order_by=block_timestamp,desc`,
        {
          headers: this.apiKey ? { 'TRON-PRO-API-KEY': this.apiKey } : {}
        }
      );

      if (!response.ok) {
        throw new Error(`TronGrid API error: ${response.status}`);
      }

      const data = await response.json();
      const transactions: TransactionDetails[] = [];

      for (const tx of data.data || []) {
        // Filter for TRX transfers
        if (tx.raw_data?.contract?.[0]?.type === 'TransferContract') {
          const contract = tx.raw_data.contract[0];
          const fromAddress = this.tronWeb.address.fromHex(contract.parameter.value.owner_address);
          const toAddress = this.tronWeb.address.fromHex(contract.parameter.value.to_address);
          const amount = (contract.parameter.value.amount / 1_000_000).toString();

          transactions.push({
            txHash: tx.txID,
            fromAddress,
            toAddress,
            amount,
            coin: 'TRX',
            network: 'TRON',
            status: tx.ret?.[0]?.contractRet === 'SUCCESS' ? 'confirmed' : 'failed',
            blockNumber: tx.blockNumber,
            timestamp: tx.block_timestamp,
            explorerUrl: this.getExplorerUrl(tx.txID)
          });
        }
      }

      return transactions;
    } catch (error) {
      console.error('Error getting TRX transactions:', error);
      return [];
    }
  }

  private async getUSDTTransactions(address: string, page: number, limit: number): Promise<TransactionDetails[]> {
    try {
      const contractAddress = this.getUSDTContractAddress();
      
      // Get TRC20 token transfers from TronGrid API
      const response = await fetch(
        `${this.apiUrl}/v1/accounts/${address}/transactions/trc20?limit=${limit}&contract_address=${contractAddress}&order_by=block_timestamp,desc`,
        {
          headers: this.apiKey ? { 'TRON-PRO-API-KEY': this.apiKey } : {}
        }
      );

      if (!response.ok) {
        throw new Error(`TronGrid API error: ${response.status}`);
      }

      const data = await response.json();
      const transactions: TransactionDetails[] = [];

      for (const tx of data.data || []) {
        const amount = (parseInt(tx.value) / Math.pow(10, 6)).toString(); // USDT has 6 decimals

        transactions.push({
          txHash: tx.transaction_id,
          fromAddress: tx.from,
          toAddress: tx.to,
          amount,
          coin: 'USDT',
          network: 'TRON',
          status: 'confirmed', // TRC20 API usually only returns confirmed transactions
          blockNumber: tx.block_number,
          timestamp: tx.block_timestamp,
          explorerUrl: this.getExplorerUrl(tx.transaction_id)
        });
      }

      return transactions;
    } catch (error) {
      console.error('Error getting USDT transactions:', error);
      return [];
    }
  }
}