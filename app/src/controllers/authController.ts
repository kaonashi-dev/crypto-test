import { Elysia, t } from 'elysia';
import { authService } from '@/services/authService';

export const authController = new Elysia({ prefix: '/auth' })
  .post('/token', async ({ headers, set }) => {
    const merchantId = headers['x-merchant-id'];
    const merchantSecret = headers['merchant-secret'];
    
    if (!merchantId) {
      set.status = 400;
      return {
        success: false,
        error: 'Merchant ID is required in X-Merchant-ID header'
      };
    }

    if (!merchantSecret) {
      set.status = 400;
      return {
        success: false,
        error: 'Merchant secret is required in Merchant-Secret header'
      };
    }

    const result = await authService.authenticate({ merchantId, merchantSecret });
    return result;
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          token: t.String(),
          expiresIn: t.Number()
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
      tags: ['Authentication'],
      summary: 'Authenticate with Merchant ID and Secret',
      description: 'Exchange merchant ID and secret for a JWT token. Provide X-Merchant-ID and Merchant-Secret headers.'
    }
  });