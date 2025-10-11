import { Elysia } from 'elysia';
import { merchantController } from '@/controllers/merchantController';
import { walletController as legacyWalletController } from '@/controllers/walletController';
import { authController } from '@/controllers/authController';
import { transactionController } from '@/controllers/transactionController';
import { currencyController } from '@/controllers/currencyController';
import { tronController } from '@/controllers/tronController';

// New hexagonal architecture controllers
import { walletController } from '@/presentation/controllers/WalletController';

export const routes = new Elysia()
  .get('/', () => ({ 
    message: 'Crypto Wallet Management API', 
    version: '1.0.0',
    description: 'Merchant-oriented API for managing crypto wallets',
    endpoints: {
      swagger: '/swagger',
      auth: '/auth',
      merchant: {
        profile: '/merchant/profile',
        wallet: '/merchant/wallet',
        wallets: '/merchant/wallets'
      },
      wallets: '/wallet',
      transactions: {
        create: 'POST /transaction',
        getByHash: 'GET /transaction/:txHash',
        getByWallet: 'GET /transaction/wallet/:walletId',
        getDetails: 'GET /transaction/details/:txHash',
        getByAddress: 'GET /transaction/address/:address'
      },
      currencies: '/currencies',
      tron: '/tron'
    },
    authentication: {
      type: 'JWT Bearer Token',
      obtain_token: 'POST /auth/sign with your API key'
    }
  }))
  .get('/health', () => ({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  }))
  .use(authController)
  .use(merchantController)
  .use(walletController) // New hexagonal architecture wallet controller
  .use(legacyWalletController) // Legacy wallet controller (will be removed)
  .use(transactionController)
  .use(currencyController)
  .use(tronController);