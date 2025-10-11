import { Elysia, t } from 'elysia';
import { currencyService } from '@/services/currencyService';
import { exchangeRateService } from '@/services/exchangeRateService';

export const currencyController = new Elysia({ prefix: '/currencies' })
  // Get all supported networks with their currencies
  .get('/networks', async () => {
    const result = await currencyService.getNetworksWithCurrencies();
    return result;
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Array(t.Object({
          id: t.Number(),
          name: t.String(),
          displayName: t.String(),
          symbol: t.String(),
          chainId: t.Union([t.Number(), t.Null()]),
          rpcUrl: t.Union([t.String(), t.Null()]),
          explorerUrl: t.Union([t.String(), t.Null()]),
          isTestnet: t.Boolean(),
          isActive: t.Boolean(),
          minConfirmations: t.Number(),
          avgBlockTime: t.Number(),
          currencies: t.Array(t.Object({
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
          }))
        }))),
        error: t.Optional(t.String())
      })
    },
    detail: {
      tags: ['Currencies'],
      summary: 'Get all supported networks with currencies',
      description: 'Get all active blockchain networks with their supported currencies and current exchange rates.'
    }
  })

  // Get supported networks only
  .get('/networks-only', async () => {
    const result = await currencyService.getSupportedNetworks();
    return result;
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Array(t.Object({
          id: t.Number(),
          name: t.String(),
          displayName: t.String(),
          symbol: t.String(),
          chainId: t.Union([t.Number(), t.Null()]),
          explorerUrl: t.Union([t.String(), t.Null()]),
          isTestnet: t.Boolean(),
          minConfirmations: t.Number(),
          avgBlockTime: t.Number()
        }))),
        error: t.Optional(t.String())
      })
    },
    detail: {
      tags: ['Currencies'],
      summary: 'Get supported networks',
      description: 'Get all supported blockchain networks without currency details.'
    }
  })

  // Get currencies for a specific network
  .get('/networks/:networkName', async ({ params: { networkName } }) => {
    const result = await currencyService.getCurrenciesByNetwork(networkName);
    return result;
  }, {
    params: t.Object({
      networkName: t.String({ minLength: 1 })
    }),
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
      tags: ['Currencies'],
      summary: 'Get currencies for a network',
      description: 'Get all supported currencies for a specific blockchain network with current exchange rates.'
    }
  })

  // Get exchange rates
  .get('/rates', async ({ query }) => {
    const baseCurrency = query.base || 'USD';
    const result = await currencyService.getExchangeRates(baseCurrency);
    return result;
  }, {
    query: t.Object({
      base: t.Optional(t.String({ default: 'USD' }))
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Array(t.Object({
          currencyId: t.Number(),
          currencySymbol: t.String(),
          currencyName: t.String(),
          rate: t.String(),
          baseCurrency: t.String(),
          lastUpdated: t.Date(),
          source: t.String()
        }))),
        error: t.Optional(t.String())
      })
    },
    detail: {
      tags: ['Exchange Rates'],
      summary: 'Get exchange rates',
      description: 'Get current exchange rates for all supported currencies.'
    }
  })

  // Get exchange rate for specific currency
  .get('/rates/:currencyId', async ({ params: { currencyId }, query }) => {
    const baseCurrency = query.base || 'USD';
    const result = await exchangeRateService.getLatestRate(parseInt(currencyId), baseCurrency);
    return result;
  }, {
    params: t.Object({
      currencyId: t.String()
    }),
    query: t.Object({
      base: t.Optional(t.String({ default: 'USD' }))
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          id: t.Number(),
          currencyId: t.Number(),
          rate: t.String(),
          baseCurrency: t.String(),
          source: t.String(),
          lastUpdated: t.Date(),
          currency: t.Object({
            symbol: t.String(),
            name: t.String()
          })
        })),
        error: t.Optional(t.String())
      })
    },
    detail: {
      tags: ['Exchange Rates'],
      summary: 'Get exchange rate for currency',
      description: 'Get the current exchange rate for a specific currency.'
    }
  })

  // Get historical rates for a currency
  .get('/rates/:currencyId/history', async ({ params: { currencyId }, query }) => {
    const baseCurrency = query.base || 'USD';
    const limit = parseInt(query.limit || '100');
    const result = await exchangeRateService.getHistoricalRates(parseInt(currencyId), baseCurrency, limit);
    return result;
  }, {
    params: t.Object({
      currencyId: t.String()
    }),
    query: t.Object({
      base: t.Optional(t.String({ default: 'USD' })),
      limit: t.Optional(t.String({ default: '100' }))
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Array(t.Object({
          rate: t.String(),
          lastUpdated: t.Date(),
          source: t.String()
        }))),
        error: t.Optional(t.String())
      })
    },
    detail: {
      tags: ['Exchange Rates'],
      summary: 'Get historical exchange rates',
      description: 'Get historical exchange rates for a specific currency.'
    }
  })

  // Convert between currencies
  .post('/convert', async ({ body }) => {
    const result = await currencyService.convertCurrency(body);
    return result;
  }, {
    body: t.Object({
      amount: t.String({ 
        pattern: '^\\d+(\\.\\d{1,18})?$',
        description: 'Amount to convert'
      }),
      fromCurrencyId: t.Number({ minimum: 1 }),
      toCurrencyId: t.Number({ minimum: 1 })
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          originalAmount: t.String(),
          convertedAmount: t.String(),
          fromCurrency: t.String(),
          toCurrency: t.String(),
          exchangeRate: t.String(),
          lastUpdated: t.Date()
        })),
        error: t.Optional(t.String())
      })
    },
    detail: {
      tags: ['Exchange Rates'],
      summary: 'Convert between currencies',
      description: 'Convert an amount from one currency to another using current exchange rates.'
    }
  })

  // Update exchange rates (admin endpoint)
  .post('/rates/update', async ({ body }) => {
    const result = await exchangeRateService.batchUpdateExchangeRates(body.rates);
    return result;
  }, {
    body: t.Object({
      rates: t.Array(t.Object({
        currencyId: t.Number(),
        rate: t.String({ pattern: '^\\d+(\\.\\d{1,8})?$' }),
        baseCurrency: t.Optional(t.String({ default: 'USD' })),
        source: t.String({ minLength: 1 })
      }))
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          updated: t.Number(),
          errors: t.Number(),
          results: t.Array(t.Any()),
          errors: t.Array(t.Any())
        })),
        message: t.Optional(t.String()),
        error: t.Optional(t.String())
      })
    },
    detail: {
      tags: ['Exchange Rates'],
      summary: 'Batch update exchange rates',
      description: 'Update multiple exchange rates at once. This is typically used by automated systems.'
    }
  })

  // Fetch rates from external providers
  .post('/rates/fetch', async () => {
    const result = await exchangeRateService.fetchFromProviders();
    return result;
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Optional(t.Object({
          updated: t.Number(),
          errors: t.Number(),
          providers: t.Number(),
          totalFetched: t.Number(),
          results: t.Array(t.Any()),
          errors: t.Array(t.Any())
        })),
        message: t.Optional(t.String()),
        error: t.Optional(t.String())
      })
    },
    detail: {
      tags: ['Exchange Rates'],
      summary: 'Fetch rates from providers',
      description: 'Fetch latest exchange rates from all configured external providers (CoinGecko, CoinMarketCap, etc.).'
    }
  });