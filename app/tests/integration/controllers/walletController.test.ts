import { describe, it, expect, beforeEach } from 'bun:test';
import { walletController } from '@/controllers/walletController';
import { TestHelpers } from '../../helpers/testHelpers';
import { createTestMerchant, createTestWallet } from '../../setup';

describe('Wallet Controller Integration Tests', () => {
  let app: any;
  let testMerchant: any;
  let authToken: string;

  beforeEach(async () => {
    app = await TestHelpers.createTestApp(walletController);
    testMerchant = await createTestMerchant();
    authToken = await TestHelpers.generateTestToken(testMerchant.merchantId);
  });

  describe('POST /wallet', () => {
    it('should create a new wallet for authenticated merchant', async () => {
      const walletData = {
        network: 'ethereum'
      };

      const response = await app.handle(
        new Request('http://localhost/wallet', {
          method: 'POST',
          headers: TestHelpers.createAuthHeaders(authToken),
          body: JSON.stringify(walletData)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectSuccessResponse(data);
      TestHelpers.expectValidWallet(data.data);
      expect(data.data.network).toBe(walletData.network);
      expect(data.data.merchantId).toBe(testMerchant.merchantId);
      expect(data.message).toBe('Wallet created successfully');
    });

    it('should create a Bitcoin wallet', async () => {
      const walletData = {
        network: 'bitcoin'
      };

      const response = await app.handle(
        new Request('http://localhost/wallet', {
          method: 'POST',
          headers: TestHelpers.createAuthHeaders(authToken),
          body: JSON.stringify(walletData)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectSuccessResponse(data);
      expect(data.data.network).toBe('bitcoin');
    });

    it('should create a Polygon wallet', async () => {
      const walletData = {
        network: 'polygon'
      };

      const response = await app.handle(
        new Request('http://localhost/wallet', {
          method: 'POST',
          headers: TestHelpers.createAuthHeaders(authToken),
          body: JSON.stringify(walletData)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectSuccessResponse(data);
      expect(data.data.network).toBe('polygon');
    });

    it('should reject invalid network type', async () => {
      const walletData = {
        network: 'invalid-network'
      };

      const response = await app.handle(
        new Request('http://localhost/wallet', {
          method: 'POST',
          headers: TestHelpers.createAuthHeaders(authToken),
          body: JSON.stringify(walletData)
        })
      );

      expect(response.status).toBe(422); // Validation error
    });

    it('should return 401 for unauthenticated request', async () => {
      const walletData = {
        network: 'ethereum'
      };

      const response = await app.handle(
        new Request('http://localhost/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(walletData)
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /wallet', () => {
    it('should return all wallets for authenticated merchant', async () => {
      const wallet1 = await createTestWallet(testMerchant.merchantId);
      const wallet2 = await createTestWallet(testMerchant.merchantId);

      const response = await app.handle(
        new Request('http://localhost/wallet', {
          method: 'GET',
          headers: TestHelpers.createAuthHeaders(authToken)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectSuccessResponse(data);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(2);
      
      data.data.forEach((wallet: any) => {
        TestHelpers.expectValidWallet(wallet);
        expect(wallet.merchantId).toBe(testMerchant.merchantId);
      });
    });

    it('should return empty array when merchant has no wallets', async () => {
      const response = await app.handle(
        new Request('http://localhost/wallet', {
          method: 'GET',
          headers: TestHelpers.createAuthHeaders(authToken)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectSuccessResponse(data);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(0);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await app.handle(
        new Request('http://localhost/wallet', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /wallet/:id', () => {
    it('should return specific wallet for authenticated merchant', async () => {
      const wallet = await createTestWallet(testMerchant.merchantId);

      const response = await app.handle(
        new Request(`http://localhost/wallet/${wallet.id}`, {
          method: 'GET',
          headers: TestHelpers.createAuthHeaders(authToken)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectSuccessResponse(data);
      TestHelpers.expectValidWallet(data.data);
      expect(data.data.id).toBe(wallet.id);
      expect(data.data.merchantId).toBe(testMerchant.merchantId);
    });

    it('should return 404 for non-existent wallet', async () => {
      const response = await app.handle(
        new Request('http://localhost/wallet/non-existent-id', {
          method: 'GET',
          headers: TestHelpers.createAuthHeaders(authToken)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectErrorResponse(data, 'Wallet not found');
    });

    it('should not return wallet belonging to another merchant', async () => {
      // Create another merchant and their wallet
      const otherMerchant = await createTestMerchant();
      otherMerchant.merchantId = 'other-merchant-id';
      otherMerchant.email = 'other@example.com';
      
      const { eq } = require('drizzle-orm');
      await require('@/db').db.update(require('@/db/schema').merchants)
        .set({ merchantId: 'other-merchant-id', email: 'other@example.com' })
        .where(eq(require('@/db/schema').merchants.id, otherMerchant.id));

      const otherWallet = await createTestWallet('other-merchant-id');

      const response = await app.handle(
        new Request(`http://localhost/wallet/${otherWallet.id}`, {
          method: 'GET',
          headers: TestHelpers.createAuthHeaders(authToken)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectErrorResponse(data, 'Wallet does not belong to this merchant');
    });

    it('should return 401 for unauthenticated request', async () => {
      const wallet = await createTestWallet(testMerchant.merchantId);

      const response = await app.handle(
        new Request(`http://localhost/wallet/${wallet.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      expect(response.status).toBe(401);
    });
  });
});