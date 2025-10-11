import { Elysia } from 'elysia';
import { AuthService } from '@/services/authService';
import type { JWTPayload } from '@/types';

export class TestHelpers {
  static async createTestApp(routes: Elysia) {
    return new Elysia().use(routes);
  }

  static async generateTestToken(merchantId: string): Promise<string> {
    const authService = new AuthService();
    const payload: JWTPayload = {
      merchantId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    
    return authService['generateJWT'](payload);
  }

  static createAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  static createApiKeyHeaders(merchantId: string, merchantSecret: string) {
    return {
      'X-Merchant-ID': merchantId,
      'Merchant-Secret': merchantSecret,
      'Content-Type': 'application/json'
    };
  }

  static expectSuccessResponse(response: any) {
    expect(response.success).toBe(true);
    expect(response.error).toBeUndefined();
  }

  static expectErrorResponse(response: any, expectedError?: string) {
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    if (expectedError) {
      expect(response.error).toBe(expectedError);
    }
  }

  static expectValidMerchant(merchant: any) {
    expect(merchant).toBeDefined();
    expect(typeof merchant.id === 'string' || typeof merchant.id === 'number').toBe(true);
    expect(typeof merchant.merchantId).toBe('string');
    expect(typeof merchant.name).toBe('string');
    expect(typeof merchant.email).toBe('string');
    expect(['active', 'inactive']).toContain(merchant.status);
    expect(merchant.createdAt).toBeInstanceOf(Date);
    expect(merchant.updatedAt).toBeInstanceOf(Date);
  }

  static expectValidWallet(wallet: any) {
    expect(wallet).toBeDefined();
    expect(typeof wallet.id).toBe('string');
    expect(typeof wallet.merchantId).toBe('string');
    expect(typeof wallet.address).toBe('string');
    expect(['bitcoin', 'ethereum', 'polygon']).toContain(wallet.network);
    expect(typeof wallet.balance).toBe('number');
    expect(['active', 'inactive']).toContain(wallet.status);
    expect(wallet.createdAt).toBeInstanceOf(Date);
    expect(wallet.updatedAt).toBeInstanceOf(Date);
  }

  static expectValidAuthResponse(response: any) {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(typeof response.data.token).toBe('string');
    expect(typeof response.data.expiresIn).toBe('number');
  }
}