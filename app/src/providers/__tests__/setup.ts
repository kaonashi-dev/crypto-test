// Test setup for provider tests

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-key';

// Global test configuration
export const testConfig = {
  tron: {
    testnet: true,
    apiUrl: 'https://nile.trongrid.io',
    contractAddresses: {
      usdt: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf'
    }
  }
};

// Test wallet data
export const testWallets = {
  tron: {
    privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    publicKey: '0xpublic1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    address: 'TTest123456789012345678901234567890'
  }
};

// Test transaction data
export const testTransactions = {
  tron: {
    trx: {
      txHash: '0xtrx123456789abcdef123456789abcdef123456789abcdef123456789abcdef',
      amount: '1.5',
      fromAddress: 'TFrom123456789012345678901234567890',
      toAddress: 'TTo123456789012345678901234567890'
    },
    usdt: {
      txHash: '0xusdt123456789abcdef123456789abcdef123456789abcdef123456789abcdef',
      amount: '10.0',
      fromAddress: 'TFrom123456789012345678901234567890',
      toAddress: 'TTo123456789012345678901234567890'
    }
  }
};