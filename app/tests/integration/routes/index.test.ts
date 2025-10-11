import { describe, it, expect, beforeEach } from 'bun:test';
import { routes } from '@/routes';
import { TestHelpers } from '../../helpers/testHelpers';

describe('Routes Integration Tests', () => {
  let app: any;

  beforeEach(async () => {
    app = await TestHelpers.createTestApp(routes);
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await app.handle(
        new Request('http://localhost/', {
          method: 'GET'
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.message).toBe('Crypto Wallet Management API');
      expect(data.version).toBe('1.0.0');
      expect(data.description).toBe('Merchant-oriented API for managing crypto wallets');
      expect(data.endpoints).toBeDefined();
      expect(data.endpoints.swagger).toBe('/swagger');
      expect(data.endpoints.auth).toBe('/auth');
      expect(data.endpoints.merchant).toBe('/merchant');
      expect(data.endpoints.wallets).toBe('/wallet');
      expect(data.authentication).toBeDefined();
      expect(data.authentication.type).toBe('JWT Bearer Token');
      expect(data.authentication.obtain_token).toBe('POST /auth/sign with your API key');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await app.handle(
        new Request('http://localhost/health', {
          method: 'GET'
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
      expect(typeof data.timestamp).toBe('string');
      
      // Validate timestamp is a valid ISO string
      const timestamp = new Date(data.timestamp);
      expect(timestamp instanceof Date).toBe(true);
      expect(!isNaN(timestamp.getTime())).toBe(true);
    });

    it('should return current timestamp on each request', async () => {
      const response1 = await app.handle(
        new Request('http://localhost/health', { method: 'GET' })
      );
      
      // Wait a small amount to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const response2 = await app.handle(
        new Request('http://localhost/health', { method: 'GET' })
      );

      const data1 = await response1.json();
      const data2 = await response2.json();
      
      expect(data1.timestamp).not.toBe(data2.timestamp);
    });
  });

  describe('Route mounting', () => {
    it('should mount auth routes', async () => {
      const response = await app.handle(
        new Request('http://localhost/auth/token', {
          method: 'POST',
          headers: {
            'X-Merchant-ID': 'test-merchant',
            'Merchant-Secret': 'test-secret'
          }
        })
      );

      // Should get a response (even if auth fails), indicating route is mounted
      expect([200, 400, 401, 500]).toContain(response.status);
    });

    it('should mount merchant routes with auth requirement', async () => {
      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'GET'
        })
      );

      // Should require auth or have error, indicating route is mounted with middleware
      expect([401, 500]).toContain(response.status);
    });

    it('should mount wallet routes with auth requirement', async () => {
      const response = await app.handle(
        new Request('http://localhost/wallet', {
          method: 'GET'
        })
      );

      // Should require auth or have error, indicating route is mounted with middleware
      expect([401, 500]).toContain(response.status);
    });

    it('should return 404 for non-existent routes', async () => {
      const response = await app.handle(
        new Request('http://localhost/non-existent-route', {
          method: 'GET'
        })
      );

      expect(response.status).toBe(404);
    });
  });

  describe('CORS and Headers', () => {
    it('should handle preflight OPTIONS requests', async () => {
      const response = await app.handle(
        new Request('http://localhost/', {
          method: 'OPTIONS',
          headers: {
            'Origin': 'http://localhost:3001',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
          }
        })
      );

      // ElysiaJS should handle OPTIONS requests appropriately
      expect([200, 204, 404]).toContain(response.status);
    });

    it('should accept JSON content type', async () => {
      const response = await app.handle(
        new Request('http://localhost/auth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-ID': 'test-merchant',
            'Merchant-Secret': 'test-secret'
          }
        })
      );

      // Should process the request (not return 415 Unsupported Media Type)
      expect(response.status).not.toBe(415);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token'
          },
          body: '{ invalid json }'
        })
      );

      // Should return appropriate error status
      expect([400, 401, 422]).toContain(response.status);
    });

    it('should handle large payloads appropriately', async () => {
      const largePayload = JSON.stringify({
        name: 'a'.repeat(10000),
        email: 'test@example.com'
      });

      const response = await app.handle(
        new Request('http://localhost/merchant/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token'
          },
          body: largePayload
        })
      );

      // Should handle large payloads (not return 413 Entity Too Large)
      expect(response.status).not.toBe(413);
    });
  });
});