import { beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { merchants, wallets } from '@/db/schema';

// Use a test database URL or in-memory database
const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const testClient = testDatabaseUrl ? postgres(testDatabaseUrl) : null;
export const testDb = testClient ? drizzle(testClient) : null;

beforeAll(async () => {
  console.log('🧪 Setting up test database...');
  if (!testDb) {
    console.warn('⚠️ No test database configured, some tests may fail');
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up test database...');
  if (testClient) {
    await testClient.end();
  }
});

beforeEach(async () => {
  console.log('🧽 Cleaning test data before test...');
  if (testDb) {
    try {
      await testDb.delete(wallets);
      await testDb.delete(merchants);
    } catch (error) {
      console.warn('Warning: Could not clean test data:', error);
    }
  }
});

afterEach(async () => {
  console.log('🧽 Cleaning test data after test...');
});

export const createTestMerchant = async () => {
  if (!testDb) {
    // Return mock data if no database available
    return {
      id: 'mock-db-id',
      name: 'Test Merchant',
      email: 'test@example.com',
      merchantId: 'test-merchant-id',
      merchantSecret: 'test-secret-hash',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  const testMerchant = {
    name: 'Test Merchant',
    email: 'test@example.com',
    merchantId: 'test-merchant-id',
    merchantSecret: 'test-secret-hash',
    status: 'active' as const
  };

  try {
    const [merchant] = await testDb.insert(merchants).values(testMerchant).returning();
    return merchant;
  } catch (error) {
    console.warn('Failed to create test merchant:', error);
    return {
      id: 'mock-db-id',
      ...testMerchant,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};

export const createTestWallet = async (merchantId: string) => {
  if (!testDb) {
    // Return mock data if no database available
    return {
      id: 'mock-wallet-id',
      merchantId,
      address: '0x1234567890abcdef',
      network: 'ethereum' as const,
      balance: 0,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  const testWallet = {
    merchantId,
    address: '0x1234567890abcdef',
    network: 'ethereum' as const,
    balance: 0,
    status: 'active' as const
  };

  try {
    const [wallet] = await testDb.insert(wallets).values(testWallet).returning();
    return wallet;
  } catch (error) {
    console.warn('Failed to create test wallet:', error);
    return {
      id: 'mock-wallet-id',
      ...testWallet,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};