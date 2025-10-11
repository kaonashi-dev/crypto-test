import { describe, it, expect, beforeEach, jest } from 'bun:test';
import { AuthService } from '@/services/authService';
import { MerchantQueries } from '@/db/queries/merchantQueries';
import type { AuthRequest } from '@/types';

// Mock the MerchantQueries
jest.mock('@/db/queries/merchantQueries', () => ({
  MerchantQueries: {
    findByMerchantId: jest.fn(),
  }
}));

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  const mockMerchant = {
    id: 'test-id',
    merchantId: 'test-merchant-id',
    merchantSecret: 'test-secret-hash',
    name: 'Test Merchant',
    email: 'test@example.com',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    const validAuthRequest: AuthRequest = {
      merchantId: 'test-merchant-id',
      merchantSecret: 'test-secret'
    };

    it('should authenticate valid credentials', async () => {
      const hashedSecret = await AuthService.hashMerchantSecret('test-secret');
      const merchantWithHashedSecret = {
        ...mockMerchant,
        merchantSecret: hashedSecret
      };

      (MerchantQueries.findByMerchantId as any).mockResolvedValue(merchantWithHashedSecret);

      const result = await authService.authenticate(validAuthRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.token).toBeDefined();
      expect(result.data?.expiresIn).toBe(3600);
      expect(result.message).toBe('Authentication successful');
    });

    it('should reject authentication for non-existent merchant', async () => {
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(null);

      const result = await authService.authenticate(validAuthRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merchant not found');
      expect(result.data).toBeUndefined();
    });

    it('should reject authentication for inactive merchant', async () => {
      const inactiveMerchant = { ...mockMerchant, status: 'inactive' };
      (MerchantQueries.findByMerchantId as any).mockResolvedValue(inactiveMerchant);

      const result = await authService.authenticate(validAuthRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merchant account is inactive');
      expect(result.data).toBeUndefined();
    });

    it('should reject authentication with invalid secret', async () => {
      const hashedSecret = await AuthService.hashMerchantSecret('different-secret');
      const merchantWithDifferentSecret = {
        ...mockMerchant,
        merchantSecret: hashedSecret
      };

      (MerchantQueries.findByMerchantId as any).mockResolvedValue(merchantWithDifferentSecret);

      const result = await authService.authenticate(validAuthRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid merchant secret');
      expect(result.data).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      (MerchantQueries.findByMerchantId as any).mockRejectedValue(new Error('Database error'));

      const result = await authService.authenticate(validAuthRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
      expect(result.data).toBeUndefined();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const payload = {
        merchantId: 'test-merchant-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = authService['generateJWT'](payload);

      const result = authService.verifyToken(token);

      expect(result).toBeDefined();
      expect(result?.merchantId).toBe(payload.merchantId);
      expect(result?.exp).toBe(payload.exp);
    });

    it('should reject expired token', async () => {
      const payload = {
        merchantId: 'test-merchant-id',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      };
      const token = authService['generateJWT'](payload);

      const result = authService.verifyToken(token);

      expect(result).toBeNull();
    });

    it('should reject malformed token', () => {
      const result = authService.verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should reject token with invalid signature', () => {
      const payload = {
        merchantId: 'test-merchant-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = authService['generateJWT'](payload);
      const tamperedToken = token.slice(0, -10) + 'tampered123';

      const result = authService.verifyToken(tamperedToken);

      expect(result).toBeNull();
    });
  });

  describe('hashMerchantSecret', () => {
    it('should generate consistent hash for same secret', async () => {
      const secret = 'test-secret';
      const hash1 = await AuthService.hashMerchantSecret(secret);
      const hash2 = await AuthService.hashMerchantSecret(secret);

      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
      expect(hash1).not.toBe(hash2); // Should be different due to random salt
      expect(hash1.includes(':')).toBe(true); // Should contain salt separator
      expect(hash2.includes(':')).toBe(true);
    });

    it('should generate different hashes for different secrets', async () => {
      const hash1 = await AuthService.hashMerchantSecret('secret1');
      const hash2 = await AuthService.hashMerchantSecret('secret2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyMerchantSecret', () => {
    it('should verify correct secret against hash', async () => {
      const secret = 'test-secret';
      const hash = await AuthService.hashMerchantSecret(secret);

      const isValid = await authService['verifyMerchantSecret'](secret, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect secret against hash', async () => {
      const correctSecret = 'correct-secret';
      const incorrectSecret = 'incorrect-secret';
      const hash = await AuthService.hashMerchantSecret(correctSecret);

      const isValid = await authService['verifyMerchantSecret'](incorrectSecret, hash);

      expect(isValid).toBe(false);
    });

    it('should handle malformed hash gracefully', async () => {
      const secret = 'test-secret';
      const malformedHash = 'invalid-hash-without-separator';

      const isValid = await authService['verifyMerchantSecret'](secret, malformedHash);

      expect(isValid).toBe(false);
    });
  });

  describe('generateMerchantId', () => {
    it('should generate unique merchant IDs', () => {
      const id1 = AuthService.generateMerchantId();
      const id2 = AuthService.generateMerchantId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });
  });

  describe('JWT token generation and decoding', () => {
    it('should generate and decode JWT correctly', () => {
      const payload = {
        merchantId: 'test-merchant-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const token = authService['generateJWT'](payload);
      const decoded = authService['decodeJWT'](token);

      expect(decoded).toEqual(payload);
    });

    it('should handle base64URL encoding/decoding correctly', () => {
      const testString = 'test string with special characters: +/=';
      const encoded = authService['base64UrlEncode'](testString);
      const decoded = authService['base64UrlDecode'](encoded);

      expect(decoded).toBe(testString);
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
    });
  });
});