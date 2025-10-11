import { Elysia } from 'elysia';
import { authService } from '@/services/authService';

export const authMiddleware = new Elysia()
  .derive(async ({ headers }) => {
    const authorization = headers.authorization;
    console.log('🔍 Auth middleware - Authorization header:', authorization);
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header found');
      return {
        user: null,
        isAuthenticated: false
      };
    }

    const token = authorization.slice(7);
    console.log('🔑 Token extracted:', token.substring(0, 20) + '...');
    
    const decoded = authService.verifyToken(token);
    console.log('🔍 Token decoded:', decoded);

    if (!decoded) {
      console.log('❌ Token verification failed');
      return {
        user: null,
        isAuthenticated: false
      };
    }

    console.log('✅ Token verified successfully, merchantId:', decoded.merchantId);
    return {
      user: {
        merchantId: decoded.merchantId
      },
      isAuthenticated: true
    };
  });

export const requireAuth = new Elysia()
  .derive(async ({ headers, set }: any) => {
    console.log('🔍 RequireAuth - Starting authentication check');
    const authorization = headers.authorization;
    console.log('🔍 RequireAuth - Authorization header:', authorization);
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header found');
      set.status = 401;
      return {
        user: null,
        isAuthenticated: false,
        error: 'Authentication required. Please provide a valid JWT token.'
      };
    }

    const token = authorization.slice(7);
    console.log('🔑 Token extracted:', token.substring(0, 20) + '...');
    
    const decoded = authService.verifyToken(token);
    console.log('🔍 Token decoded:', decoded);

    if (!decoded) {
      console.log('❌ Token verification failed');
      set.status = 401;
      return {
        user: null,
        isAuthenticated: false,
        error: 'Invalid or expired token.'
      };
    }

    console.log('✅ Token verified successfully, merchantId:', decoded.merchantId);
    return {
      user: {
        merchantId: decoded.merchantId
      },
      isAuthenticated: true
    };
  });