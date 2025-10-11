import { Elysia, t } from 'elysia';
import { walletService } from '@/services/walletService';
import { requireAuth } from '@/middleware/auth';

export const walletController = new Elysia({ prefix: '/wallet' })
  .use(requireAuth)
  .post('/', async ({ body, user }) => {
    const walletData = {
      merchantId: user.merchantId,
      network: body.network
    };
    const result = await walletService.createWallet(walletData);
    return result;
  }, {
    body: t.Object({
      network: t.Union([
        t.Literal('bitcoin'),
        t.Literal('ethereum'),
        t.Literal('polygon')
      ])
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          id: t.String(),
          merchantId: t.String(),
          address: t.String(),
          network: t.Union([
            t.Literal('bitcoin'),
            t.Literal('ethereum'),
            t.Literal('polygon')
          ]),
          balance: t.Number(),
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
      tags: ['Wallets'],
      summary: 'Create a new wallet',
      description: 'Create a new wallet for the authenticated merchant.'
    }
  })
  .get('/', async ({ user }) => {
    const result = await walletService.getWalletsByMerchantId(user.merchantId);
    return result;
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Array(t.Object({
          id: t.String(),
          merchantId: t.String(),
          address: t.String(),
          network: t.Union([
            t.Literal('bitcoin'),
            t.Literal('ethereum'),
            t.Literal('polygon')
          ]),
          balance: t.Number(),
          status: t.Union([t.Literal('active'), t.Literal('inactive')]),
          createdAt: t.Date(),
          updatedAt: t.Date()
        }))),
        error: t.Optional(t.String())
      }),
      401: t.Object({
        success: t.Boolean(),
        error: t.String()
      })
    },
    detail: {
      tags: ['Wallets'],
      summary: 'Get merchant wallets',
      description: 'Get all wallets belonging to the authenticated merchant.'
    }
  })
  .get('/:id', async ({ params: { id }, user }) => {
    const result = await walletService.getWalletByIdAndMerchant(id, user.merchantId);
    return result;
  }, {
    params: t.Object({
      id: t.String()
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          id: t.String(),
          merchantId: t.String(),
          address: t.String(),
          network: t.Union([
            t.Literal('bitcoin'),
            t.Literal('ethereum'),
            t.Literal('polygon')
          ]),
          balance: t.Number(),
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
      tags: ['Wallets'],
      summary: 'Get wallet by ID',
      description: 'Get a specific wallet by ID (only if it belongs to the authenticated merchant).'
    }
  });