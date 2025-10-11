import { describe, it, expect, beforeEach } from 'bun:test';
import { merchantController } from '@/controllers/merchantController';
import { TestHelpers } from '../../helpers/testHelpers';
import { createTestMerchant } from '../../setup';

describe('Merchant Controller Integration Tests', () => {
  let app: any;
  let testMerchant: any;
  let authToken: string;

  beforeEach(async () => {
    app = await TestHelpers.createTestApp(merchantController);
    testMerchant = await createTestMerchant();
    authToken = await TestHelpers.generateTestToken(testMerchant.merchantId);
  });

  describe('GET /merchant/profile', () => {
    it('should return merchant profile for authenticated user', async () => {
      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'GET',
          headers: TestHelpers.createAuthHeaders(authToken)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectSuccessResponse(data);
      TestHelpers.expectValidMerchant(data.data);
      expect(data.data.merchantId).toBe(testMerchant.merchantId);
      expect(data.data.name).toBe(testMerchant.name);
      expect(data.data.email).toBe(testMerchant.email);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required. Please provide a valid JWT token.');
    });

    it('should return 401 for invalid token', async () => {
      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'GET',
          headers: TestHelpers.createAuthHeaders('invalid-token')
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid or expired token.');
    });
  });

  describe('PUT /merchant/profile', () => {
    it('should update merchant profile with valid data', async () => {
      const updateData = {
        name: 'Updated Merchant Name',
        email: 'updated@example.com'
      };

      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'PUT',
          headers: TestHelpers.createAuthHeaders(authToken),
          body: JSON.stringify(updateData)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectSuccessResponse(data);
      expect(data.data.name).toBe(updateData.name);
      expect(data.data.email).toBe(updateData.email);
      expect(data.message).toBe('Merchant updated successfully');
    });

    it('should update only name when provided', async () => {
      const updateData = {
        name: 'New Merchant Name Only'
      };

      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'PUT',
          headers: TestHelpers.createAuthHeaders(authToken),
          body: JSON.stringify(updateData)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectSuccessResponse(data);
      expect(data.data.name).toBe(updateData.name);
      expect(data.data.email).toBe(testMerchant.email); // Should remain unchanged
    });

    it('should update only email when provided', async () => {
      const updateData = {
        email: 'newemail@example.com'
      };

      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'PUT',
          headers: TestHelpers.createAuthHeaders(authToken),
          body: JSON.stringify(updateData)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      TestHelpers.expectSuccessResponse(data);
      expect(data.data.email).toBe(updateData.email);
      expect(data.data.name).toBe(testMerchant.name); // Should remain unchanged
    });

    it('should reject invalid email format', async () => {
      const updateData = {
        email: 'invalid-email-format'
      };

      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'PUT',
          headers: TestHelpers.createAuthHeaders(authToken),
          body: JSON.stringify(updateData)
        })
      );

      expect(response.status).toBe(422); // Validation error
    });

    it('should reject empty name', async () => {
      const updateData = {
        name: ''
      };

      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'PUT',
          headers: TestHelpers.createAuthHeaders(authToken),
          body: JSON.stringify(updateData)
        })
      );

      expect(response.status).toBe(422); // Validation error
    });

    it('should reject name that is too long', async () => {
      const updateData = {
        name: 'a'.repeat(101) // Exceeds 100 character limit
      };

      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'PUT',
          headers: TestHelpers.createAuthHeaders(authToken),
          body: JSON.stringify(updateData)
        })
      );

      expect(response.status).toBe(422); // Validation error
    });

    it('should return 401 for unauthenticated request', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required. Please provide a valid JWT token.');
    });
  });
});