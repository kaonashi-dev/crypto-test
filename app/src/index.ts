import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { routes } from '@/routes';
import { testConnection } from './db/index';
import { runMigrations } from './db/migrate';

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Failed to connect to Neon database');
    }
    
    // Run database migrations
    await runMigrations();
    
    // Start the server
    const app = new Elysia()
      .use(cors({
        origin: 'http://localhost:5173',
        credentials: true
      }))
      .use(swagger({
        documentation: {
          info: {
            title: 'Crypto Wallet Management API',
            description: 'API for managing crypto wallets and merchants',
            version: '1.0.0',
          },
          tags: [
            { name: 'Authentication', description: 'Authentication endpoints' },
            { name: 'Merchants', description: 'Merchant management endpoints' },
            { name: 'Wallets', description: 'Wallet management endpoints' },
            { name: 'Transactions', description: 'Blockchain transaction management endpoints' },
            { name: 'Transaction Query', description: 'Direct blockchain transaction query endpoints' },
            { name: 'Currencies', description: 'Supported currencies and networks endpoints' },
            { name: 'Exchange Rates', description: 'Exchange rate management and conversion endpoints' }
          ]
        }
      }))
      .use(routes)
      .listen(3000);

    console.log(`🚀 Server is running at http://localhost:3000`);
    console.log(`📚 Swagger documentation available at http://localhost:3000/swagger`);
    
    return app;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();