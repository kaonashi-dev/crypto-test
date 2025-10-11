import { Elysia } from 'elysia';
import { requireAuth } from '../middleware/auth';
import { container } from '../../infrastructure/di/Container';
import { CreateWalletSchema, GetWalletSchema, ListWalletsSchema } from '../schemas/WalletSchemas';

export const walletController = new Elysia({ prefix: '/wallet' })
  .use(requireAuth)
  .post('/', async ({ body, user }) => {
    const createWalletUseCase = container.get('createWalletUseCase');
    
    const result = await createWalletUseCase.execute({
      merchantId: user.merchantId,
      network: body.network
    });

    if (result.isFailure) {
      const error = result.error;
      
      // Handle specific domain errors
      if (error.name === 'MerchantNotFoundError') {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }
      
      if (error.name === 'InvalidMerchantStatusError') {
        return {
          success: false,
          error: 'Cannot create wallet for inactive merchant'
        };
      }

      return {
        success: false,
        error: 'Failed to create wallet'
      };
    }

    return {
      success: true,
      data: result.value,
      message: 'Wallet created successfully'
    };
  }, {
    ...CreateWalletSchema,
    detail: {
      tags: ['Wallets'],
      summary: 'Create a new wallet',
      description: 'Create a new wallet for the authenticated merchant.'
    }
  })
  .get('/', async ({ user }) => {
    const listMerchantWalletsUseCase = container.get('listMerchantWalletsUseCase');
    
    const result = await listMerchantWalletsUseCase.execute(user.merchantId);

    if (result.isFailure) {
      const error = result.error;
      
      if (error.name === 'MerchantNotFoundError') {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }

      return {
        success: false,
        error: 'Failed to retrieve wallets'
      };
    }

    return {
      success: true,
      data: result.value
    };
  }, {
    ...ListWalletsSchema,
    detail: {
      tags: ['Wallets'],
      summary: 'Get merchant wallets',
      description: 'Get all wallets belonging to the authenticated merchant.'
    }
  })
  .get('/:id', async ({ params: { id }, user }) => {
    const getWalletUseCase = container.get('getWalletUseCase');
    
    const result = await getWalletUseCase.execute(id, user.merchantId);

    if (result.isFailure) {
      const error = result.error;
      
      if (error.name === 'WalletNotFoundError') {
        return {
          success: false,
          error: 'Wallet not found'
        };
      }
      
      if (error.name === 'WalletAccessDeniedError') {
        return {
          success: false,
          error: 'Wallet does not belong to this merchant'
        };
      }

      return {
        success: false,
        error: 'Failed to retrieve wallet'
      };
    }

    return {
      success: true,
      data: result.value
    };
  }, {
    ...GetWalletSchema,
    detail: {
      tags: ['Wallets'],
      summary: 'Get wallet by ID',
      description: 'Get a specific wallet by ID (only if it belongs to the authenticated merchant).'
    }
  });