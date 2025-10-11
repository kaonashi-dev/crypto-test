import { Elysia, t } from 'elysia';
import { transactionService } from '@/services/transactionService';
import { authService } from '@/services/authService';
import { requireAuth } from '@/middleware/auth';
import { ProviderFactory } from '@/providers/blockchainProvider';
import type { ApiResponse } from '@/types';

export const transactionController = new Elysia({ prefix: '/transaction' })
  .post('/', async ({ body, headers, set }) => {
    console.log('🔍 Transaction Controller - Starting authentication check');
    const authorization = headers.authorization;
    console.log('🔍 Transaction Controller - Authorization header:', authorization);
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('❌ Transaction Controller - No valid authorization header found');
      set.status = 401;
      return {
        success: false,
        error: 'Authentication required. Please provide a valid JWT token.'
      };
    }

    const token = authorization.slice(7);
    console.log('🔑 Transaction Controller - Token extracted:', token.substring(0, 20) + '...');
    
    const decoded = authService.verifyToken(token);
    console.log('🔍 Transaction Controller - Token decoded:', decoded);

    if (!decoded) {
      console.log('❌ Transaction Controller - Token verification failed');
      set.status = 401;
      return {
        success: false,
        error: 'Invalid or expired token.'
      };
    }

    console.log('✅ Transaction Controller - Token verified successfully, merchantId:', decoded.merchantId);

    // Validate transaction type requirements
    if (body.type === 'send' && !body.toAddress) {
      set.status = 400;
      return {
        success: false,
        error: 'toAddress is required for send transactions'
      };
    }

    if (body.type === 'receive' && !body.fromAddress) {
      set.status = 400;
      return {
        success: false,
        error: 'fromAddress is required for receive transactions'
      };
    }

    // Validate network and coin compatibility
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

    const result = await transactionService.createTransaction(body, decoded.merchantId);
    return result;
  }, {
    body: t.Object({
      reference: t.Optional(t.String({ 
        minLength: 1, 
        maxLength: 255,
        description: 'Merchant reference for the transaction'
      })),
      amount: t.String({ 
        pattern: '^\\d+(\\.\\d{1,8})?$',
        description: 'Amount in decimal format with up to 8 decimal places'
      }),
      type: t.Union([
        t.Literal('send'),
        t.Literal('receive'),
        t.Literal('request')
      ]),
      toAddress: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      fromAddress: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      network: t.Union([
        t.Literal('BTC'),
        t.Literal('ETH'),
        t.Literal('POLYGON'),
        t.Literal('BNB'),
        t.Literal('TRON')
      ], {
        description: 'Blockchain network to use for the transaction'
      }),
      coin: t.Union([
        t.Literal('BTC'),
        t.Literal('ETH'),
        t.Literal('USDT'),
        t.Literal('MATIC'),
        t.Literal('BNB'),
        t.Literal('TRX')
      ], {
        description: 'Coin/token to transfer'
      }),
      // Keep backward compatibility with walletId (optional for now)
      walletId: t.Optional(t.String())
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          id: t.Number(),
          walletId: t.Union([t.Number(), t.Null()]),
          txHash: t.String(),
          amount: t.String(),
          type: t.Union([t.Literal('send'), t.Literal('receive'), t.Literal('request')]),
          status: t.Union([t.Literal('pending'), t.Literal('confirmed'), t.Literal('failed')]),
          fromAddress: t.Union([t.String(), t.Null()]),
          toAddress: t.Union([t.String(), t.Null()]),
          blockNumber: t.Union([t.Number(), t.Null()]),
          gasUsed: t.Union([t.String(), t.Null()]),
          gasPrice: t.Union([t.String(), t.Null()]),
          network: t.Union([t.String(), t.Null()]),
          coin: t.Union([t.String(), t.Null()]),
          reference: t.Union([t.String(), t.Null()]),
          merchantId: t.Union([t.String(), t.Null()]),
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
      tags: ['Transactions'],
      summary: 'Create a new transaction',
      description: 'Create a new blockchain transaction (send or receive). For send transactions, toAddress is required. For receive transactions (tracking external deposits), fromAddress is required.'
    }
  })
  .post('/request', async ({ body, headers, set }) => {
    console.log('🔍 Request Transaction Controller - Starting authentication check');
    const authorization = headers.authorization;
    console.log('🔍 Request Transaction Controller - Authorization header:', authorization);
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('❌ Request Transaction Controller - No valid authorization header found');
      set.status = 401;
      return {
        success: false,
        error: 'Authentication required. Please provide a valid JWT token.'
      };
    }

    const token = authorization.slice(7);
    console.log('🔑 Request Transaction Controller - Token extracted:', token.substring(0, 20) + '...');
    
    const decoded = authService.verifyToken(token);
    console.log('🔍 Request Transaction Controller - Token decoded:', decoded);

    if (!decoded) {
      console.log('❌ Request Transaction Controller - Token verification failed');
      set.status = 401;
      return {
        success: false,
        error: 'Invalid or expired token.'
      };
    }

    console.log('✅ Request Transaction Controller - Token verified successfully, merchantId:', decoded.merchantId);

    // Validate network and coin compatibility
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

    const result = await transactionService.createRequestTransaction(body, decoded.merchantId);
    return result;
  }, {
    body: t.Object({
      reference: t.Optional(t.String({ 
        minLength: 1, 
        maxLength: 255,
        description: 'Merchant reference for the transaction'
      })),
      amount: t.String({ 
        pattern: '^\\d+(\\.\\d{1,8})?$',
        description: 'Amount in decimal format with up to 8 decimal places'
      }),
      network: t.Union([
        t.Literal('BTC'),
        t.Literal('ETH'),
        t.Literal('POLYGON'),
        t.Literal('BNB'),
        t.Literal('TRON')
      ], {
        description: 'Blockchain network to use for the transaction'
      }),
      coin: t.Union([
        t.Literal('BTC'),
        t.Literal('ETH'),
        t.Literal('USDT'),
        t.Literal('MATIC'),
        t.Literal('BNB'),
        t.Literal('TRX')
      ], {
        description: 'Coin/token to transfer'
      })
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          transaction: t.Object({
            id: t.Number(),
            walletId: t.Union([t.Number(), t.Null()]),
            txHash: t.String(),
            amount: t.String(),
            type: t.Union([t.Literal('send'), t.Literal('receive'), t.Literal('request')]),
            status: t.Union([t.Literal('pending'), t.Literal('confirmed'), t.Literal('failed')]),
            fromAddress: t.Union([t.String(), t.Null()]),
            toAddress: t.Union([t.String(), t.Null()]),
            blockNumber: t.Union([t.Number(), t.Null()]),
            gasUsed: t.Union([t.String(), t.Null()]),
            gasPrice: t.Union([t.String(), t.Null()]),
            network: t.Union([t.String(), t.Null()]),
            coin: t.Union([t.String(), t.Null()]),
            reference: t.Union([t.String(), t.Null()]),
            merchantId: t.Union([t.String(), t.Null()]),
            createdAt: t.Date(),
            updatedAt: t.Date()
          }),
          wallet: t.Object({
            id: t.Number(),
            address: t.String(),
            network: t.String(),
            coin: t.String(),
            balance: t.String(),
            status: t.String(),
            createdAt: t.Date(),
            updatedAt: t.Date()
          })
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
      tags: ['Transactions'],
      summary: 'Create a new request transaction',
      description: 'Create a new request transaction using an existing merchant wallet. The merchant must have an active wallet configured for the specified network and coin. Returns the wallet information where funds should be sent.'
    }
  })
  .get('/:txHash', async ({ params: { txHash }, headers, set }) => {
    console.log('🔍 Transaction Controller - Starting authentication check for GET');
    const authorization = headers.authorization;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('❌ Transaction Controller - No valid authorization header found');
      set.status = 401;
      return {
        success: false,
        error: 'Authentication required. Please provide a valid JWT token.'
      };
    }

    const token = authorization.slice(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      console.log('❌ Transaction Controller - Token verification failed');
      set.status = 401;
      return {
        success: false,
        error: 'Invalid or expired token.'
      };
    }

    console.log('✅ Transaction Controller - Getting transaction:', txHash);
    const result = await transactionService.getTransaction(txHash, decoded.merchantId);
    return result;
  }, {
    params: t.Object({
      txHash: t.String({ minLength: 1, maxLength: 255 })
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          id: t.Number(),
          walletId: t.Union([t.Number(), t.Null()]),
          txHash: t.String(),
          amount: t.String(),
          type: t.Union([t.Literal('send'), t.Literal('receive'), t.Literal('request')]),
          status: t.Union([t.Literal('pending'), t.Literal('confirmed'), t.Literal('failed')]),
          fromAddress: t.Union([t.String(), t.Null()]),
          toAddress: t.Union([t.String(), t.Null()]),
          blockNumber: t.Union([t.Number(), t.Null()]),
          gasUsed: t.Union([t.String(), t.Null()]),
          gasPrice: t.Union([t.String(), t.Null()]),
          network: t.Union([t.String(), t.Null()]),
          coin: t.Union([t.String(), t.Null()]),
          reference: t.Union([t.String(), t.Null()]),
          merchantId: t.Union([t.String(), t.Null()]),
          createdAt: t.Date(),
          updatedAt: t.Date()
        })),
        error: t.Optional(t.String())
      }),
      401: t.Object({
        success: t.Boolean(),
        error: t.String()
      }),
      404: t.Object({
        success: t.Boolean(),
        error: t.String()
      })
    },
    detail: {
      tags: ['Transactions'],
      summary: 'Get transaction by hash',
      description: 'Get transaction details and current status by transaction hash. Only returns transactions belonging to the authenticated merchant.'
    }
  })
  .get('/wallet/:walletId', async ({ params, query, set, headers }) => {
    console.log('🔍 Transaction Controller - Getting blockchain transactions for wallet:', params.walletId);
    
    try {
      const authorization = headers.authorization;
      
      if (!authorization || !authorization.startsWith('Bearer ')) {
        set.status = 401;
        return {
          success: false,
          message: 'Authentication required. Please provide a valid JWT token.',
          data: null
        } as ApiResponse<null>;
      }

      const token = authorization.slice(7);
      const decoded = authService.verifyToken(token);

      if (!decoded) {
        set.status = 401;
        return {
          success: false,
          message: 'Invalid or expired token.',
          data: null
        } as ApiResponse<null>;
      }

      const { walletId } = params;
      const { page = 1, limit = 10 } = query;

      // Validate pagination parameters
      const pageNum = Math.max(1, parseInt(page.toString()) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit.toString()) || 10));

      console.log(`🔍 Getting wallet info for walletId ${walletId} and merchant ${decoded.merchantId}`);

      // Get wallet information from database (address, network, coin)
      const walletInfo = await transactionService.getWalletAddress(walletId, decoded.merchantId);
      
      if (!walletInfo.success) {
        set.status = 404;
        return {
          success: false,
          message: walletInfo.error || 'Wallet not found',
          data: null
        } as ApiResponse<null>;
      }

      const address = walletInfo.data!.address;
      const network = walletInfo.data!.network;
      const coin = walletInfo.data!.coin;

      console.log(`🔍 Querying blockchain transactions for wallet address ${address} on ${network} network for ${coin} coin`);
      console.log(`📄 Pagination: page ${pageNum}, limit ${limitNum}`);

      // Get provider for the network
      const provider = ProviderFactory.createProvider(network as any);
      
      // Get address transactions from blockchain using the wallet's configured coin
      const addressTransactions = await provider.getAddressTransactions(
        address, 
        coin, 
        pageNum, 
        limitNum
      );

      console.log(`✅ Found ${addressTransactions.transactions.length} blockchain transactions for wallet`);

      return {
        success: true,
        message: 'Wallet blockchain transactions retrieved successfully',
        data: {
          ...addressTransactions,
          walletInfo: {
            id: walletId,
            address: address,
            network: network,
            coin: coin
          }
        }
      } as ApiResponse<typeof addressTransactions & { walletInfo: any }>;

    } catch (error) {
      console.error('❌ Error getting wallet blockchain transactions:', error);
      set.status = 500;
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get wallet blockchain transactions',
        data: null
      } as ApiResponse<null>;
    }
  }, {
    params: t.Object({
      walletId: t.String({ 
        description: 'Wallet ID to get blockchain transactions for',
        minLength: 1
      })
    }),
    query: t.Object({
      page: t.Optional(t.Union([t.String(), t.Number()], { 
        description: 'Page number for pagination (default: 1)',
        default: 1
      })),
      limit: t.Optional(t.Union([t.String(), t.Number()], { 
        description: 'Number of transactions per page (default: 10, max: 100)',
        default: 10
      }))
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Object({
          transactions: t.Array(t.Object({
            txHash: t.String(),
            fromAddress: t.String(),
            toAddress: t.String(),
            amount: t.String(),
            coin: t.String(),
            network: t.String(),
            status: t.Union([t.Literal('pending'), t.Literal('confirmed'), t.Literal('failed')]),
            blockNumber: t.Optional(t.Number()),
            blockHash: t.Optional(t.String()),
            gasUsed: t.Optional(t.String()),
            gasPrice: t.Optional(t.String()),
            fee: t.Optional(t.String()),
            confirmations: t.Optional(t.Number()),
            timestamp: t.Optional(t.Number()),
            explorerUrl: t.Optional(t.String())
          })),
          total: t.Number(),
          page: t.Number(),
          limit: t.Number(),
          walletInfo: t.Object({
            id: t.String(),
            address: t.String(),
            network: t.String(),
            coin: t.String()
          })
        })
      }),
      400: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Null()
      }),
      401: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Null()
      }),
      404: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Null()
      }),
      500: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Null()
      })
    },
    detail: {
      tags: ['Transactions'],
      summary: 'Get blockchain transactions for a wallet',
      description: 'Retrieve transaction history for a specific wallet directly from the blockchain. Uses the wallet ID to get the address, network, and coin from the database automatically.'
    }
  })
  .get('/details/:txHash', async ({ params, query, set, headers }) => {
    console.log('🔍 Transaction Controller - Getting transaction details for:', params.txHash);
    
    try {
      const authorization = headers.authorization;
      
      if (!authorization || !authorization.startsWith('Bearer ')) {
        set.status = 401;
        return {
          success: false,
          message: 'Authentication required. Please provide a valid JWT token.',
          data: null
        } as ApiResponse<null>;
      }

      const token = authorization.slice(7);
      const decoded = authService.verifyToken(token);

      if (!decoded) {
        set.status = 401;
        return {
          success: false,
          message: 'Invalid or expired token.',
          data: null
        } as ApiResponse<null>;
      }

      const { txHash } = params;
      const { network, coin } = query;

      if (!network) {
        set.status = 400;
        return {
          success: false,
          message: 'Network parameter is required',
          data: null
        } as ApiResponse<null>;
      }

      // Validate network
      const validNetworks = ['BTC', 'ETH', 'POLYGON', 'BNB', 'TRON'];
      if (!validNetworks.includes(network.toUpperCase())) {
        set.status = 400;
        return {
          success: false,
          message: `Invalid network. Supported networks: ${validNetworks.join(', ')}`,
          data: null
        } as ApiResponse<null>;
      }

      console.log(`🔍 Querying transaction ${txHash} on ${network.toUpperCase()} network${coin ? ` for ${coin.toUpperCase()} coin` : ''}`);

      // Get provider for the network
      const provider = ProviderFactory.createProvider(network.toUpperCase() as any);
      
      // Get transaction details from blockchain
      const transactionDetails = await provider.getTransactionDetails(txHash, coin?.toUpperCase());

      console.log('✅ Transaction details retrieved successfully');

      return {
        success: true,
        message: 'Transaction details retrieved successfully',
        data: transactionDetails
      } as ApiResponse<typeof transactionDetails>;

    } catch (error) {
      console.error('❌ Error getting transaction details:', error);
      set.status = 500;
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get transaction details',
        data: null
      } as ApiResponse<null>;
    }
  }, {
    params: t.Object({
      txHash: t.String({ 
        description: 'Transaction hash to query',
        minLength: 1
      })
    }),
    query: t.Object({
      network: t.String({ 
        description: 'Blockchain network (BTC, ETH, POLYGON, BNB, TRON)',
        enum: ['BTC', 'ETH', 'POLYGON', 'BNB', 'TRON', 'btc', 'eth', 'polygon', 'bnb', 'tron']
      }),
      coin: t.Optional(t.String({ 
        description: 'Specific coin/token (BTC, ETH, USDT, MATIC, BNB, TRX)',
        enum: ['BTC', 'ETH', 'USDT', 'MATIC', 'BNB', 'TRX', 'btc', 'eth', 'usdt', 'matic', 'bnb', 'trx']
      }))
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Object({
          txHash: t.String(),
          fromAddress: t.String(),
          toAddress: t.String(),
          amount: t.String(),
          coin: t.String(),
          network: t.String(),
          status: t.Union([t.Literal('pending'), t.Literal('confirmed'), t.Literal('failed')]),
          blockNumber: t.Optional(t.Number()),
          blockHash: t.Optional(t.String()),
          gasUsed: t.Optional(t.String()),
          gasPrice: t.Optional(t.String()),
          fee: t.Optional(t.String()),
          confirmations: t.Optional(t.Number()),
          timestamp: t.Optional(t.Number()),
          explorerUrl: t.Optional(t.String())
        })
      }),
      400: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Null()
      }),
      401: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Null()
      }),
      500: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Null()
      })
    },
    detail: {
      tags: ['Transactions'],
      summary: 'Get transaction details by hash from blockchain',
      description: 'Retrieve detailed information about a specific transaction directly from the blockchain'
    }
  })
  .get('/address/:address', async ({ params, query, set, headers }) => {
    console.log('🔍 Transaction Controller - Getting transactions for address:', params.address);
    
    try {
      const authorization = headers.authorization;
      
      if (!authorization || !authorization.startsWith('Bearer ')) {
        set.status = 401;
        return {
          success: false,
          message: 'Authentication required. Please provide a valid JWT token.',
          data: null
        } as ApiResponse<null>;
      }

      const token = authorization.slice(7);
      const decoded = authService.verifyToken(token);

      if (!decoded) {
        set.status = 401;
        return {
          success: false,
          message: 'Invalid or expired token.',
          data: null
        } as ApiResponse<null>;
      }

      const { address } = params;
      const { network, coin, page = 1, limit = 10 } = query;

      if (!network) {
        set.status = 400;
        return {
          success: false,
          message: 'Network parameter is required',
          data: null
        } as ApiResponse<null>;
      }

      // Validate network
      const validNetworks = ['BTC', 'ETH', 'POLYGON', 'BNB', 'TRON'];
      if (!validNetworks.includes(network.toUpperCase())) {
        set.status = 400;
        return {
          success: false,
          message: `Invalid network. Supported networks: ${validNetworks.join(', ')}`,
          data: null
        } as ApiResponse<null>;
      }

      // Validate pagination parameters
      const pageNum = Math.max(1, parseInt(page.toString()) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit.toString()) || 10));

      console.log(`🔍 Querying transactions for address ${address} on ${network.toUpperCase()} network${coin ? ` for ${coin.toUpperCase()} coin` : ''}`);
      console.log(`📄 Pagination: page ${pageNum}, limit ${limitNum}`);

      // Get provider for the network
      const provider = ProviderFactory.createProvider(network.toUpperCase() as any);
      
      // Get address transactions from blockchain
      const addressTransactions = await provider.getAddressTransactions(
        address, 
        coin?.toUpperCase(), 
        pageNum, 
        limitNum
      );

      console.log(`✅ Found ${addressTransactions.transactions.length} transactions for address`);

      return {
        success: true,
        message: 'Address transactions retrieved successfully',
        data: addressTransactions
      } as ApiResponse<typeof addressTransactions>;

    } catch (error) {
      console.error('❌ Error getting address transactions:', error);
      set.status = 500;
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get address transactions',
        data: null
      } as ApiResponse<null>;
    }
  }, {
    params: t.Object({
      address: t.String({ 
        description: 'Wallet address to query transactions for',
        minLength: 1
      })
    }),
    query: t.Object({
      network: t.String({ 
        description: 'Blockchain network (BTC, ETH, POLYGON, BNB, TRON)',
        enum: ['BTC', 'ETH', 'POLYGON', 'BNB', 'TRON', 'btc', 'eth', 'polygon', 'bnb', 'tron']
      }),
      coin: t.Optional(t.String({ 
        description: 'Specific coin/token to filter by (BTC, ETH, USDT, MATIC, BNB, TRX)',
        enum: ['BTC', 'ETH', 'USDT', 'MATIC', 'BNB', 'TRX', 'btc', 'eth', 'usdt', 'matic', 'bnb', 'trx']
      })),
      page: t.Optional(t.Union([t.String(), t.Number()], { 
        description: 'Page number for pagination (default: 1)',
        default: 1
      })),
      limit: t.Optional(t.Union([t.String(), t.Number()], { 
        description: 'Number of transactions per page (default: 10, max: 100)',
        default: 10
      }))
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Object({
          transactions: t.Array(t.Object({
            txHash: t.String(),
            fromAddress: t.String(),
            toAddress: t.String(),
            amount: t.String(),
            coin: t.String(),
            network: t.String(),
            status: t.Union([t.Literal('pending'), t.Literal('confirmed'), t.Literal('failed')]),
            blockNumber: t.Optional(t.Number()),
            blockHash: t.Optional(t.String()),
            gasUsed: t.Optional(t.String()),
            gasPrice: t.Optional(t.String()),
            fee: t.Optional(t.String()),
            confirmations: t.Optional(t.Number()),
            timestamp: t.Optional(t.Number()),
            explorerUrl: t.Optional(t.String())
          })),
          total: t.Number(),
          page: t.Number(),
          limit: t.Number()
        })
      }),
      400: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Null()
      }),
      401: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Null()
      }),
      500: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Null()
      })
    },
    detail: {
      tags: ['Transactions'],
      summary: 'Get transactions for an address from blockchain',
      description: 'Retrieve transaction history for a specific wallet address directly from the blockchain'
    }
  });