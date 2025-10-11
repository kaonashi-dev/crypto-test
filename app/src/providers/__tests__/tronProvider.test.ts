import { describe, it, expect, beforeEach, jest } from 'bun:test';
import { TronProvider } from '../tronProvider';
import { TransactionRequest } from '../blockchainProvider';

// Mock TronWeb
const mockTronWeb = {
  createAccount: jest.fn(),
  setPrivateKey: jest.fn(),
  isAddress: jest.fn(),
  trx: {
    getBalance: jest.fn(),
    getTransactionInfo: jest.fn(),
    getTransaction: jest.fn(),
    sign: jest.fn(),
    sendRawTransaction: jest.fn()
  },
  transactionBuilder: {
    sendTrx: jest.fn()
  },
  contract: jest.fn()
};

jest.mock('tronweb', () => ({
  TronWeb: jest.fn(() => mockTronWeb)
}));

describe('TronProvider', () => {
  let tronProvider: TronProvider;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create provider instance with testnet configuration
    tronProvider = new TronProvider({
      isTestnet: true,
      apiUrl: 'https://nile.trongrid.io'
    });
  });

  describe('createWallet', () => {
    it('should create a new Tron wallet', async () => {
      const mockWallet = {
        privateKey: '0x1234567890abcdef',
        publicKey: '0xpublic1234567890abcdef',
        address: {
          base58: 'TTest123456789012345678901234567890',
          hex: '0x414d4c3b2d6f3c4e5a6b7c8d9e0f1a2b3c4d5e6f'
        }
      };

      mockTronWeb.createAccount.mockResolvedValue(mockWallet);

      const result = await tronProvider.createWallet();

      expect(result).toEqual({
        address: mockWallet.address.base58,
        privateKey: mockWallet.privateKey,
        publicKey: mockWallet.publicKey
      });
      expect(mockTronWeb.createAccount).toHaveBeenCalledTimes(1);
    });

    it('should handle wallet creation errors', async () => {
      mockTronWeb.createAccount.mockRejectedValue(new Error('Network error'));

      await expect(tronProvider.createWallet()).rejects.toThrow(
        'Failed to create Tron wallet: Network error'
      );
    });
  });

  describe('validateAddress', () => {
    it('should validate correct Tron addresses', () => {
      mockTronWeb.isAddress.mockReturnValue(true);

      const result = tronProvider.validateAddress('TTest123456789012345678901234567890');

      expect(result).toBe(true);
      expect(mockTronWeb.isAddress).toHaveBeenCalledWith('TTest123456789012345678901234567890');
    });

    it('should reject invalid Tron addresses', () => {
      mockTronWeb.isAddress.mockReturnValue(false);

      const result = tronProvider.validateAddress('invalid-address');

      expect(result).toBe(false);
    });

    it('should handle validation errors gracefully', () => {
      mockTronWeb.isAddress.mockImplementation(() => {
        throw new Error('Invalid format');
      });

      const result = tronProvider.validateAddress('test-address');

      expect(result).toBe(false);
    });
  });

  describe('getWalletBalance', () => {
    const testAddress = 'TTest123456789012345678901234567890';

    beforeEach(() => {
      mockTronWeb.isAddress.mockReturnValue(true);
    });

    it('should get TRX balance when no coin specified', async () => {
      mockTronWeb.trx.getBalance.mockResolvedValue(5000000); // 5 TRX in SUN

      const balance = await tronProvider.getWalletBalance(testAddress);

      expect(balance).toBe(5); // 5 TRX
      expect(mockTronWeb.trx.getBalance).toHaveBeenCalledWith(testAddress);
    });

    it('should get TRX balance when TRX coin specified', async () => {
      mockTronWeb.trx.getBalance.mockResolvedValue(10000000); // 10 TRX in SUN

      const balance = await tronProvider.getWalletBalance(testAddress, 'TRX');

      expect(balance).toBe(10); // 10 TRX
    });

    it('should get USDT balance when USDT coin specified', async () => {
      const mockContract = {
        balanceOf: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue('1000000') // 1 USDT with 6 decimals
        })
      };

      mockTronWeb.contract.mockResolvedValue(mockContract);

      const balance = await tronProvider.getWalletBalance(testAddress, 'USDT');

      expect(balance).toBe(1); // 1 USDT
      expect(mockTronWeb.contract).toHaveBeenCalled();
    });

    it('should throw error for unsupported coin', async () => {
      const balance = await tronProvider.getWalletBalance(testAddress, 'BTC');

      expect(balance).toBe(0); // Should return 0 for unsupported coins
    });

    it('should return 0 for invalid address', async () => {
      mockTronWeb.isAddress.mockReturnValue(false);

      const balance = await tronProvider.getWalletBalance('invalid-address');

      expect(balance).toBe(0);
    });
  });

  describe('sendTransaction', () => {
    const mockRequest: TransactionRequest = {
      fromAddress: 'TFrom123456789012345678901234567890',
      toAddress: 'TTo123456789012345678901234567890',
      amount: '1.5',
      network: 'TRON',
      coin: 'TRX',
      privateKey: '0x1234567890abcdef',
      reference: 'test-ref-123'
    };

    beforeEach(() => {
      mockTronWeb.isAddress.mockReturnValue(true);
      mockTronWeb.setPrivateKey.mockImplementation(() => {});
    });

    it('should send TRX transaction successfully', async () => {
      mockTronWeb.trx.getBalance.mockResolvedValue(5000000); // 5 TRX available
      mockTronWeb.transactionBuilder.sendTrx.mockResolvedValue({
        raw_data: { contract: [] }
      });
      mockTronWeb.trx.sign.mockResolvedValue({
        signature: ['0xsignature']
      });
      mockTronWeb.trx.sendRawTransaction.mockResolvedValue({
        result: true,
        txid: '0xtransactionhash123'
      });

      const result = await tronProvider.sendTransaction(mockRequest);

      expect(result.success).toBe(true);
      expect(result.txHash).toBe('0xtransactionhash123');
      expect(result.status).toBe('pending');
      expect(mockTronWeb.setPrivateKey).toHaveBeenCalledWith(mockRequest.privateKey);
      expect(mockTronWeb.transactionBuilder.sendTrx).toHaveBeenCalledWith(
        mockRequest.toAddress,
        1500000, // 1.5 TRX in SUN
        mockRequest.fromAddress
      );
    });

    it('should send USDT transaction successfully', async () => {
      const usdtRequest = { ...mockRequest, coin: 'USDT' as const };
      
      const mockContract = {
        balanceOf: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue('2000000') // 2 USDT available
        }),
        transfer: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({
            txID: '0xusdttransactionhash123'
          })
        })
      };

      mockTronWeb.contract.mockResolvedValue(mockContract);
      mockTronWeb.trx.getBalance.mockResolvedValue(20000000); // 20 TRX for gas

      const result = await tronProvider.sendTransaction(usdtRequest);

      expect(result.success).toBe(true);
      expect(result.txHash).toBe('0xusdttransactionhash123');
      expect(mockTronWeb.contract).toHaveBeenCalled();
    });

    it('should fail when private key is missing', async () => {
      const requestWithoutKey = { ...mockRequest, privateKey: undefined };

      const result = await tronProvider.sendTransaction(requestWithoutKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Private key is required for Tron transactions');
    });

    it('should fail when from address is invalid', async () => {
      mockTronWeb.isAddress.mockImplementation((addr) => addr !== mockRequest.fromAddress);

      const result = await tronProvider.sendTransaction(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid from address');
    });

    it('should fail when insufficient TRX balance', async () => {
      mockTronWeb.trx.getBalance.mockResolvedValue(1000000); // Only 1 TRX available

      const result = await tronProvider.sendTransaction(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient TRX balance');
    });

    it('should fail for unsupported coin', async () => {
      const invalidRequest = { ...mockRequest, coin: 'BTC' as const };

      const result = await tronProvider.sendTransaction(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported coin: BTC on Tron network');
    });
  });

  describe('getTransactionStatus', () => {
    const txHash = '0xtransactionhash123';

    it('should return confirmed status for successful transaction', async () => {
      mockTronWeb.trx.getTransactionInfo.mockResolvedValue({
        blockNumber: 12345,
        result: 'SUCCESS',
        receipt: {
          energy_usage_total: 25000,
          net_usage: 267
        }
      });
      mockTronWeb.trx.getTransaction.mockResolvedValue({
        ret: [{ contractRet: 'SUCCESS' }]
      });

      const result = await tronProvider.getTransactionStatus(txHash);

      expect(result.status).toBe('confirmed');
      expect(result.blockNumber).toBe(12345);
      expect(result.gasUsed).toBe('25000');
      expect(result.confirmations).toBe(1);
    });

    it('should return failed status for failed transaction', async () => {
      mockTronWeb.trx.getTransactionInfo.mockResolvedValue({
        blockNumber: 12345,
        result: 'FAILED'
      });
      mockTronWeb.trx.getTransaction.mockResolvedValue({});

      const result = await tronProvider.getTransactionStatus(txHash);

      expect(result.status).toBe('failed');
      expect(result.blockNumber).toBe(12345);
    });

    it('should return pending status for unconfirmed transaction', async () => {
      mockTronWeb.trx.getTransactionInfo.mockResolvedValue({});
      mockTronWeb.trx.getTransaction.mockResolvedValue({});

      const result = await tronProvider.getTransactionStatus(txHash);

      expect(result.status).toBe('pending');
      expect(result.confirmations).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockTronWeb.trx.getTransactionInfo.mockRejectedValue(new Error('Network error'));

      const result = await tronProvider.getTransactionStatus(txHash);

      expect(result.status).toBe('pending');
    });
  });

  describe('estimateFee', () => {
    const mockRequest = {
      fromAddress: 'TFrom123456789012345678901234567890',
      toAddress: 'TTo123456789012345678901234567890',
      amount: '1',
      network: 'TRON' as const,
      coin: 'TRX' as const
    };

    it('should estimate TRX transaction fee', async () => {
      const fee = await tronProvider.estimateFee(mockRequest);
      expect(fee).toBe('0.1');
    });

    it('should estimate USDT transaction fee', async () => {
      const usdtRequest = { ...mockRequest, coin: 'USDT' as const };
      const fee = await tronProvider.estimateFee(usdtRequest);
      expect(fee).toBe('15');
    });

    it('should return default fee for unknown coin', async () => {
      const unknownRequest = { ...mockRequest, coin: 'BTC' as const };
      const fee = await tronProvider.estimateFee(unknownRequest);
      expect(fee).toBe('1');
    });
  });

  describe('utility methods', () => {
    it('should return correct testnet status', () => {
      expect(tronProvider.isTestnet()).toBe(true);
    });

    it('should return correct USDT contract address for testnet', () => {
      const contractAddress = tronProvider.getUSDTContractAddress();
      expect(contractAddress).toBe('TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf');
    });

    it('should return correct explorer URL', () => {
      const url = tronProvider.getExplorerUrl('0xtxhash123');
      expect(url).toBe('https://nile.tronscan.org/#/transaction/0xtxhash123');
    });
  });
});