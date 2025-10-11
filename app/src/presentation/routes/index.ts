import { Elysia } from 'elysia';
import { walletController } from '../controllers/WalletController';

// Import legacy controllers for gradual migration
import { authController } from '../../controllers/authController';
import { merchantController } from '../../controllers/merchantController';
import { transactionController } from '../../controllers/transactionController';
import { currencyController } from '../../controllers/currencyController';

export const routes = new Elysia({ prefix: '/api' })
  // New hexagonal architecture controllers
  .use(walletController)
  
  // Legacy controllers (to be migrated)
  .use(authController)
  .use(merchantController)
  .use(transactionController)
  .use(currencyController)
  
  // Health check
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    detail: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Check if the API is running'
    }
  });