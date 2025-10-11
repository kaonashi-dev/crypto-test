import { Elysia } from 'elysia';
import { authService } from '@/services/authService';

export const simpleAuth = new Elysia()
  .derive(async ({ headers, set }: any) => {
    console.log('🔍 SimpleAuth - Starting authentication check');
    const authorization = headers.authorization;
    console.log('🔍 SimpleAuth - Authorization header:', authorization);
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('❌ SimpleAuth - No valid authorization header found');
      set.status = 401;
      return {
        user: null,
        isAuthenticated: false
      };
    }

    const token = authorization.slice(7);
    console.log('🔑 SimpleAuth - Token extracted:', token.substring(0, 20) + '...');
    
    const decoded = authService.verifyToken(token);
    console.log('🔍 SimpleAuth - Token decoded:', decoded);

    if (!decoded) {
      console.log('❌ SimpleAuth - Token verification failed');
      set.status = 401;
      return {
        user: null,
        isAuthenticated: false
      };
    }

    console.log('✅ SimpleAuth - Token verified successfully, merchantId:', decoded.merchantId);
    return {
      user: {
        merchantId: decoded.merchantId
      },
      isAuthenticated: true
    };
  });
