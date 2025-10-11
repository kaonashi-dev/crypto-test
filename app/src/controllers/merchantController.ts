import { Elysia, t } from 'elysia';
import { merchantService } from '@/services/merchantService';
import { authService } from '@/services/authService';

export const merchantController = new Elysia({ prefix: '/merchant' })
  .get('/profile', async ({ headers, set }) => {
    console.log('🔍 Controller - Starting authentication check');
    const authorization = headers.authorization;
    console.log('🔍 Controller - Authorization header:', authorization);
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('❌ Controller - No valid authorization header found');
      set.status = 401;
      return {
        success: false,
        error: 'Authentication required. Please provide a valid JWT token.'
      };
    }

    const token = authorization.slice(7);
    console.log('🔑 Controller - Token extracted:', token.substring(0, 20) + '...');
    
    const decoded = authService.verifyToken(token);
    console.log('🔍 Controller - Token decoded:', decoded);

    if (!decoded) {
      console.log('❌ Controller - Token verification failed');
      set.status = 401;
      return {
        success: false,
        error: 'Invalid or expired token.'
      };
    }

    console.log('✅ Controller - Token verified successfully, merchantId:', decoded.merchantId);
    
    const result = await merchantService.getMerchantById(decoded.merchantId);
    return result;
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String(),
          status: t.Union([t.Literal('active'), t.Literal('inactive')]),
          createdAt: t.Date(),
          updatedAt: t.Date()
        })),
        error: t.Optional(t.String())
      }),
      401: t.Object({
        success: t.Boolean(),
        error: t.String()
      })
    },
    detail: {
      tags: ['Merchants'],
      summary: 'Get merchant profile',
      description: 'Get the authenticated merchant profile information.'
    }
  })
  .put('/profile', async ({ body, user }) => {
    const result = await merchantService.updateMerchant(user.merchantId, body);
    return result;
  }, {
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      email: t.Optional(t.String({ format: 'email' }))
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String(),
          status: t.Union([t.Literal('active'), t.Literal('inactive')]),
          createdAt: t.Date(),
          updatedAt: t.Date()
        })),
        message: t.Optional(t.String()),
        error: t.Optional(t.String())
      }),
      401: t.Object({
        success: t.Boolean(),
        error: t.String()
      })
    },
    detail: {
      tags: ['Merchants'],
      summary: 'Update merchant profile',
      description: 'Update the authenticated merchant profile information.'
    }
  })
  .post('/wallet', async ({ body, headers, set }) => {
    console.log('🔍 Merchant Wallet Controller - Starting authentication check');
    const authorization = headers.authorization;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('❌ Merchant Wallet Controller - No valid authorization header found');
      set.status = 401;
      return {
        success: false,
        error: 'Authentication required. Please provide a valid JWT token.'
      };
    }

    const token = authorization.slice(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      console.log('❌ Merchant Wallet Controller - Token verification failed');
      set.status = 401;
      return {
        success: false,
        error: 'Invalid or expired token.'
      };
    }

    console.log('✅ Merchant Wallet Controller - Token verified successfully, merchantId:', decoded.merchantId);

    // Validate network and coin combination
    const validNetworkCoinCombinations = {
      'BTC': ['BTC'],
      'ETH': ['ETH', 'USDT'],
      'POLYGON': ['MATIC', 'USDT'],
      'BNB': ['BNB', 'USDT'],
      'TRON': ['TRX', 'USDT']
    };

    if (!validNetworkCoinCombinations[body.network]?.includes(body.coin)) {
      set.status = 400;
      return {
        success: false,
        error: `Invalid network-coin combination. ${body.network} network does not support ${body.coin} coin.`
      };
    }

    const result = await merchantService.getMerchantWallet(decoded.merchantId, body.network, body.coin);
    return result;
  }, {
    body: t.Object({
      network: t.Union([
        t.Literal('BTC'),
        t.Literal('ETH'),
        t.Literal('POLYGON'),
        t.Literal('BNB'),
        t.Literal('TRON')
      ]),
      coin: t.Union([
        t.Literal('BTC'),
        t.Literal('ETH'),
        t.Literal('USDT'),
        t.Literal('MATIC'),
        t.Literal('BNB'),
        t.Literal('TRX')
      ])
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          address: t.String(),
          network: t.String(),
          coin: t.String(),
          balance: t.String(),
          status: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date()
        })),
        message: t.Optional(t.String()),
        error: t.Optional(t.String())
      }),
      400: t.Object({
        success: t.Boolean(),
        error: t.String()
      }),
      401: t.Object({
        success: t.Boolean(),
        error: t.String()
      })
    },
    detail: {
      tags: ['Merchants'],
      summary: 'Get or create merchant wallet address',
      description: 'Get the merchant wallet address for a specific network and coin combination. Creates the wallet if it doesn\'t exist.'
    }
  })
  .get('/wallets', async ({ headers, set }) => {
    console.log('🔍 Merchant Wallets List Controller - Starting authentication check');
    const authorization = headers.authorization;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('❌ Merchant Wallets List Controller - No valid authorization header found');
      set.status = 401;
      return {
        success: false,
        error: 'Authentication required. Please provide a valid JWT token.'
      };
    }

    const token = authorization.slice(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      console.log('❌ Merchant Wallets List Controller - Token verification failed');
      set.status = 401;
      return {
        success: false,
        error: 'Invalid or expired token.'
      };
    }

    console.log('✅ Merchant Wallets List Controller - Token verified successfully, merchantId:', decoded.merchantId);

    const result = await merchantService.getAllMerchantWallets(decoded.merchantId);
    return result;
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Array(t.Object({
          id: t.Number(),
          address: t.String(),
          network: t.String(),
          coin: t.String(),
          balance: t.String(),
          balanceUsd: t.Optional(t.String()),
          status: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date()
        }))),
        message: t.Optional(t.String()),
        error: t.Optional(t.String())
      }),
      401: t.Object({
        success: t.Boolean(),
        error: t.String()
      })
    },
    detail: {
      tags: ['Merchants'],
      summary: 'List all merchant wallets',
      description: 'Get all wallets belonging to the authenticated merchant with their current balances.'
    }
  });