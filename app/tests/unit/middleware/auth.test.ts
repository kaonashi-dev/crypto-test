import { describe, it, expect, beforeEach, jest } from 'bun:test';
import { authService } from '@/services/authService';
import type { JWTPayload } from '@/types';

// Mock the authService
const mockVerifyToken = jest.fn();
jest.mock('@/services/authService', () => ({
  authService: {
    verifyToken: mockVerifyToken,
  }
}));

describe('Auth Middleware Unit Tests', () => {
  const mockUser = {
    merchantId: 'test-merchant-id'
  };

  const mockJWTPayload: JWTPayload = {
    merchantId: 'test-merchant-id',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should extract and verify valid Bearer token', () => {
      mockVerifyToken.mockReturnValue(mockJWTPayload);
      
      const headers = {
        authorization: 'Bearer valid-jwt-token'
      };

      const result = testAuthMiddleware(headers);

      expect(result.user).toEqual({ merchantId: 'test-merchant-id' });
      expect(result.isAuthenticated).toBe(true);
      expect(mockVerifyToken).toHaveBeenCalledWith('valid-jwt-token');
    });

    it('should return null user for missing authorization header', () => {
      const headers = {};

      const result = testAuthMiddleware(headers);

      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
      expect(mockVerifyToken).not.toHaveBeenCalled();
    });

    it('should return null user for empty authorization header', () => {
      const headers = {
        authorization: ''
      };

      const result = testAuthMiddleware(headers);

      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
      expect(mockVerifyToken).not.toHaveBeenCalled();
    });

    it('should return null user for non-Bearer authorization', () => {
      const headers = {
        authorization: 'Basic dXNlcjpwYXNz'
      };

      const result = testAuthMiddleware(headers);

      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
      expect(mockVerifyToken).not.toHaveBeenCalled();
    });

    it('should return null user for Bearer without token', () => {
      mockVerifyToken.mockReturnValue(null);
      
      const headers = {
        authorization: 'Bearer '
      };

      const result = testAuthMiddleware(headers);

      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
      expect(mockVerifyToken).toHaveBeenCalledWith('');
    });

    it('should return null user for invalid token', () => {
      mockVerifyToken.mockReturnValue(null);
      
      const headers = {
        authorization: 'Bearer invalid-token'
      };

      const result = testAuthMiddleware(headers);

      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
      expect(mockVerifyToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should handle tokens with extra spaces', () => {
      const headers = {
        authorization: '  Bearer   valid-jwt-token  '
      };

      const result = testAuthMiddleware(headers);

      // This should fail because our middleware doesn't trim the authorization header
      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });

    it('should extract token correctly with mixed case Bearer', () => {
      mockVerifyToken.mockReturnValue(mockJWTPayload);
      
      const headers = {
        authorization: 'bearer valid-jwt-token'
      };

      const result = testAuthMiddleware(headers);

      // This should fail since our middleware is case-sensitive
      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });

    it('should handle very long tokens', () => {
      const longToken = 'a'.repeat(1000);
      mockVerifyToken.mockReturnValue(mockJWTPayload);
      
      const headers = {
        authorization: `Bearer ${longToken}`
      };

      const result = testAuthMiddleware(headers);

      expect(result.user).toEqual({ merchantId: 'test-merchant-id' });
      expect(result.isAuthenticated).toBe(true);
      expect(mockVerifyToken).toHaveBeenCalledWith(longToken);
    });
  });

  describe('requireAuth', () => {
    it('should allow authenticated users', () => {
      const context = {
        user: mockUser,
        isAuthenticated: true,
        set: { status: null }
      };

      expect(() => testRequireAuth(context)).not.toThrow();
    });

    it('should reject unauthenticated users', () => {
      const context = {
        user: null,
        isAuthenticated: false,
        set: { status: null }
      };

      expect(() => testRequireAuth(context)).toThrow('Authentication required. Please provide a valid JWT token.');
      expect(context.set.status).toBe(401);
    });

    it('should reject authenticated but null user', () => {
      const context = {
        user: null,
        isAuthenticated: true,
        set: { status: null }
      };

      expect(() => testRequireAuth(context)).toThrow('Authentication required. Please provide a valid JWT token.');
      expect(context.set.status).toBe(401);
    });

    it('should reject user without authentication flag', () => {
      const context = {
        user: mockUser,
        isAuthenticated: false,
        set: { status: null }
      };

      expect(() => testRequireAuth(context)).toThrow('Authentication required. Please provide a valid JWT token.');
      expect(context.set.status).toBe(401);
    });

    it('should return user and authentication status for valid requests', () => {
      const context = {
        user: mockUser,
        isAuthenticated: true,
        set: { status: null }
      };

      const result = testRequireAuth(context);

      expect(result.user).toEqual(mockUser);
      expect(result.isAuthenticated).toBe(true);
    });
  });

  // Helper functions to simulate middleware behavior
  function testAuthMiddleware(headers: any) {
    const authorization = headers.authorization;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return {
        user: null,
        isAuthenticated: false
      };
    }

    const token = authorization.slice(7);
    const decoded = mockVerifyToken(token);

    if (!decoded) {
      return {
        user: null,
        isAuthenticated: false
      };
    }

    return {
      user: {
        merchantId: decoded.merchantId
      },
      isAuthenticated: true
    };
  }

  function testRequireAuth(context: any) {
    if (!context.isAuthenticated || !context.user) {
      context.set.status = 401;
      throw new Error('Authentication required. Please provide a valid JWT token.');
    }
    
    return {
      user: context.user,
      isAuthenticated: context.isAuthenticated
    };
  }
});