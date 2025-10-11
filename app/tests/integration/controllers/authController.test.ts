import { describe, it, expect, beforeEach } from 'bun:test';
import { authController } from '@/controllers/authController';
import { TestHelpers } from '../../helpers/testHelpers';
import { createTestMerchant } from '../../setup';
import { AuthService } from '@/services/authService';

describe('Auth Controller Integration Tests', () => {
  let app: any;
  let testMerchant: any;

  beforeEach(async () => {
    app = await TestHelpers.createTestApp(authController);
    testMerchant = await createTestMerchant();
  });

  describe('POST /auth/token', () => {
    it('should authenticate with valid credentials', async () => {
      const merchantSecret = 'test-plain-secret';
      const hashedSecret = await AuthService.hashMerchantSecret(merchantSecret);
      
      testMerchant.merchantSecret = hashedSecret;
      const { eq } = require('drizzle-orm');
      await require('@/db').db.update(require('@/db/schema').merchants)
        .set({ merchantSecret: hashedSecret })
        .where(eq(require('@/db/schema').merchants.id, testMerchant.id));

      const response = await app.handle(
        new Request('http://localhost/auth/token', {
          method: 'POST',
          headers: TestHelpers.createApiKeyHeaders(testMerchant.merchantId, merchantSecret)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectValidAuthResponse(data);
    });

    it('should reject authentication with missing merchant ID', async () => {
      const response = await app.handle(
        new Request('http://localhost/auth/token', {
          method: 'POST',
          headers: {
            'Merchant-Secret': 'test-secret',
            'Content-Type': 'application/json'
          }
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      TestHelpers.expectErrorResponse(data, 'Merchant ID is required in X-Merchant-ID header');
    });

    it('should reject authentication with missing merchant secret', async () => {
      const response = await app.handle(
        new Request('http://localhost/auth/token', {
          method: 'POST',
          headers: {
            'X-Merchant-ID': testMerchant.merchantId,
            'Content-Type': 'application/json'
          }
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      TestHelpers.expectErrorResponse(data, 'Merchant secret is required in Merchant-Secret header');
    });

    it('should reject authentication with invalid merchant ID', async () => {
      const response = await app.handle(
        new Request('http://localhost/auth/token', {
          method: 'POST',
          headers: TestHelpers.createApiKeyHeaders('invalid-merchant-id', 'test-secret')
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectErrorResponse(data, 'Merchant not found');
    });

    it('should reject authentication with invalid merchant secret', async () => {
      const response = await app.handle(
        new Request('http://localhost/auth/token', {
          method: 'POST',
          headers: TestHelpers.createApiKeyHeaders(testMerchant.merchantId, 'invalid-secret')
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectErrorResponse(data, 'Invalid merchant secret');
    });

    it('should reject authentication for inactive merchant', async () => {
      const { eq } = require('drizzle-orm');
      await require('@/db').db.update(require('@/db/schema').merchants)
        .set({ status: 'inactive' })
        .where(eq(require('@/db/schema').merchants.id, testMerchant.id));

      const response = await app.handle(
        new Request('http://localhost/auth/token', {
          method: 'POST',
          headers: TestHelpers.createApiKeyHeaders(testMerchant.merchantId, 'test-secret')
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectErrorResponse(data, 'Merchant account is inactive');
    });
  });
});