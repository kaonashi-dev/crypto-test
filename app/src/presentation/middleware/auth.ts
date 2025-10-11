import { Elysia } from 'elysia';
import { authService } from '../../services/authService';

export const authMiddleware = new Elysia()
  .derive(async ({ headers }) => {
    const authorization = headers.authorization;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return {
        user: null,
        isAuthenticated: false
      };
    }

    const token = authorization.slice(7);
    const decoded = authService.verifyToken(token);

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
  });

export const requireAuth = new Elysia()
  .derive(async ({ headers, set }: any) => {
    const authorization = headers.authorization;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      set.status = 401;
      return {
        user: null,
        isAuthenticated: false,
        error: 'Authentication required. Please provide a valid JWT token.'
      };
    }

    const token = authorization.slice(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      set.status = 401;
      return {
        user: null,
        isAuthenticated: false,
        error: 'Invalid or expired token.'
      };
    }

    return {
      user: {
        merchantId: decoded.merchantId
      },
      isAuthenticated: true
    };
  });