import { Elysia, t } from 'elysia';
import { currencyService } from '@/services/currencyService';

export const tronController = new Elysia({ prefix: '/tron' })
  // Get Tron network with its currencies (TRX and USDT)
  .get('/networks', async () => {
    const result = await currencyService.getCurrenciesByNetwork('tron');
    return result;
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Array(t.Object({
          id: t.Number(),
          name: t.String(),
          symbol: t.String(),
          decimals: t.Number(),
          contractAddress: t.Union([t.String(), t.Null()]),
          tokenStandard: t.Union([t.String(), t.Null()]),
          isNative: t.Boolean(),
          isStablecoin: t.Boolean(),
          minTransactionAmount: t.String(),
          maxTransactionAmount: t.Union([t.String(), t.Null()]),
          logoUrl: t.Union([t.String(), t.Null()]),
          description: t.Union([t.String(), t.Null()]),
          exchangeRate: t.Optional(t.Object({
            rate: t.String(),
            baseCurrency: t.String(),
            lastUpdated: t.Date(),
            source: t.String()
          }))
        }))),
        error: t.Optional(t.String())
      })
    },
    detail: {
      tags: ['Tron'],
      summary: 'Get Tron network currencies',
      description: 'Get all supported currencies on the Tron network (TRX and USDT) with current exchange rates.'
    }
  })

  // Get Tron network information
  .get('/network-info', async () => {
    const result = await currencyService.getSupportedNetworks();
    const tronNetwork = result.data?.find(network => network.name === 'tron');
    
    if (!tronNetwork) {
      return {
        success: false,
        error: 'Tron network not found'
      };
    }

    return {
      success: true,
      data: tronNetwork
    };
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          id: t.Number(),
          name: t.String(),
          displayName: t.String(),
          symbol: t.String(),
          chainId: t.Union([t.Number(), t.Null()]),
          explorerUrl: t.Union([t.String(), t.Null()]),
          isTestnet: t.Boolean(),
          minConfirmations: t.Number(),
          avgBlockTime: t.Number()
        })),
        error: t.Optional(t.String())
      })
    },
    detail: {
      tags: ['Tron'],
      summary: 'Get Tron network information',
      description: 'Get basic information about the Tron network.'
    }
  })

  // Get specific currency information
  .get('/currency/:symbol', async ({ params: { symbol } }) => {
    const result = await currencyService.getCurrenciesByNetwork('tron');
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to retrieve Tron currencies'
      };
    }

    const currency = result.data.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
    
    if (!currency) {
      return {
        success: false,
        error: `Currency ${symbol} not found on Tron network`
      };
    }

    return {
      success: true,
      data: currency
    };
  }, {
    params: t.Object({
      symbol: t.String({ minLength: 1 })
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          id: t.Number(),
          name: t.String(),
          symbol: t.String(),
          decimals: t.Number(),
          contractAddress: t.Union([t.String(), t.Null()]),
          tokenStandard: t.Union([t.String(), t.Null()]),
          isNative: t.Boolean(),
          isStablecoin: t.Boolean(),
          minTransactionAmount: t.String(),
          maxTransactionAmount: t.Union([t.String(), t.Null()]),
          logoUrl: t.Union([t.String(), t.Null()]),
          description: t.Union([t.String(), t.Null()]),
          exchangeRate: t.Optional(t.Object({
            rate: t.String(),
            baseCurrency: t.String(),
            lastUpdated: t.Date(),
            source: t.String()
          }))
        })),
        error: t.Optional(t.String())
      })
    },
    detail: {
      tags: ['Tron'],
      summary: 'Get specific Tron currency',
      description: 'Get information about a specific currency on the Tron network (TRX or USDT).'
    }
  });
