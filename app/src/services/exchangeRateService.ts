import { db } from '@/db';
import { currencies, exchangeRates } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { ApiResponse } from '@/types';

export interface ExchangeRateUpdate {
  currencyId: number;
  rate: string;
  baseCurrency?: string;
  source: string;
}

export interface ExchangeRateProvider {
  name: string;
  fetchRates(): Promise<ExchangeRateUpdate[]>;
}

export class ExchangeRateService {
  private providers: ExchangeRateProvider[] = [];

  // Register an exchange rate provider
  registerProvider(provider: ExchangeRateProvider): void {
    this.providers.push(provider);
  }

  // Update exchange rate for a specific currency
  async updateExchangeRate(update: ExchangeRateUpdate): Promise<ApiResponse<any>> {
    try {
      // Verify currency exists
      const [currency] = await db
        .select()
        .from(currencies)
        .where(eq(currencies.id, update.currencyId))
        .limit(1);

      if (!currency) {
        return {
          success: false,
          error: 'Currency not found'
        };
      }

      // Deactivate old rates
      await db
        .update(exchangeRates)
        .set({ isActive: false })
        .where(
          and(
            eq(exchangeRates.currencyId, update.currencyId),
            eq(exchangeRates.baseCurrency, update.baseCurrency || 'USD')
          )
        );

      // Insert new rate
      const [newRate] = await db
        .insert(exchangeRates)
        .values({
          currencyId: update.currencyId,
          rate: update.rate,
          baseCurrency: update.baseCurrency || 'USD',
          source: update.source,
          lastUpdated: new Date(),
          isActive: true
        })
        .returning();

      return {
        success: true,
        data: newRate,
        message: 'Exchange rate updated successfully'
      };
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      return {
        success: false,
        error: 'Failed to update exchange rate'
      };
    }
  }

  // Batch update exchange rates
  async batchUpdateExchangeRates(updates: ExchangeRateUpdate[]): Promise<ApiResponse<any>> {
    try {
      const results = [];
      const errors = [];

      for (const update of updates) {
        const result = await this.updateExchangeRate(update);
        if (result.success) {
          results.push(result.data);
        } else {
          errors.push({ currencyId: update.currencyId, error: result.error });
        }
      }

      return {
        success: true,
        data: {
          updated: results.length,
          errors: errors.length,
          results,
          errors
        },
        message: `Updated ${results.length} rates with ${errors.length} errors`
      };
    } catch (error) {
      console.error('Error batch updating exchange rates:', error);
      return {
        success: false,
        error: 'Failed to batch update exchange rates'
      };
    }
  }

  // Fetch rates from all registered providers
  async fetchFromProviders(): Promise<ApiResponse<any>> {
    try {
      if (this.providers.length === 0) {
        return {
          success: false,
          error: 'No exchange rate providers registered'
        };
      }

      const allUpdates: ExchangeRateUpdate[] = [];

      for (const provider of this.providers) {
        try {
          console.log(`Fetching rates from provider: ${provider.name}`);
          const rates = await provider.fetchRates();
          allUpdates.push(...rates);
        } catch (error) {
          console.error(`Error fetching from provider ${provider.name}:`, error);
        }
      }

      if (allUpdates.length === 0) {
        return {
          success: false,
          error: 'No rates were fetched from any provider'
        };
      }

      // Batch update all fetched rates
      const result = await this.batchUpdateExchangeRates(allUpdates);
      
      return {
        success: true,
        data: {
          ...result.data,
          providers: this.providers.length,
          totalFetched: allUpdates.length
        },
        message: `Fetched ${allUpdates.length} rates from ${this.providers.length} providers`
      };
    } catch (error) {
      console.error('Error fetching from providers:', error);
      return {
        success: false,
        error: 'Failed to fetch rates from providers'
      };
    }
  }

  // Get the latest exchange rate for a currency
  async getLatestRate(currencyId: number, baseCurrency: string = 'USD'): Promise<ApiResponse<any>> {
    try {
      const [rate] = await db
        .select({
          id: exchangeRates.id,
          currencyId: exchangeRates.currencyId,
          rate: exchangeRates.rate,
          baseCurrency: exchangeRates.baseCurrency,
          source: exchangeRates.source,
          lastUpdated: exchangeRates.lastUpdated,
          currency: {
            symbol: currencies.symbol,
            name: currencies.name
          }
        })
        .from(exchangeRates)
        .innerJoin(currencies, eq(exchangeRates.currencyId, currencies.id))
        .where(
          and(
            eq(exchangeRates.currencyId, currencyId),
            eq(exchangeRates.baseCurrency, baseCurrency.toUpperCase()),
            eq(exchangeRates.isActive, true)
          )
        )
        .orderBy(desc(exchangeRates.lastUpdated))
        .limit(1);

      if (!rate) {
        return {
          success: false,
          error: 'Exchange rate not found'
        };
      }

      return {
        success: true,
        data: rate
      };
    } catch (error) {
      console.error('Error getting latest rate:', error);
      return {
        success: false,
        error: 'Failed to get latest exchange rate'
      };
    }
  }

  // Get historical rates for a currency
  async getHistoricalRates(
    currencyId: number, 
    baseCurrency: string = 'USD', 
    limit: number = 100
  ): Promise<ApiResponse<any[]>> {
    try {
      const rates = await db
        .select({
          rate: exchangeRates.rate,
          lastUpdated: exchangeRates.lastUpdated,
          source: exchangeRates.source
        })
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.currencyId, currencyId),
            eq(exchangeRates.baseCurrency, baseCurrency.toUpperCase())
          )
        )
        .orderBy(desc(exchangeRates.lastUpdated))
        .limit(Math.min(limit, 1000)); // Cap at 1000 records

      return {
        success: true,
        data: rates
      };
    } catch (error) {
      console.error('Error getting historical rates:', error);
      return {
        success: false,
        error: 'Failed to get historical rates'
      };
    }
  }
}

// Mock CoinGecko provider implementation
export class CoinGeckoProvider implements ExchangeRateProvider {
  name = 'CoinGecko';
  private apiUrl = 'https://api.coingecko.com/api/v3';

  async fetchRates(): Promise<ExchangeRateUpdate[]> {
    try {
      // This is a mock implementation
      // In reality, you would make actual API calls to CoinGecko
      console.log('Fetching rates from CoinGecko (mock)...');
      
      // Mock data - replace with actual API calls
      const mockRates: ExchangeRateUpdate[] = [
        {
          currencyId: 1, // Bitcoin
          rate: '43250.50',
          baseCurrency: 'USD',
          source: 'coingecko'
        },
        {
          currencyId: 2, // Ethereum
          rate: '2650.75',
          baseCurrency: 'USD',
          source: 'coingecko'
        },
        {
          currencyId: 3, // Polygon
          rate: '0.85',
          baseCurrency: 'USD',
          source: 'coingecko'
        }
      ];

      return mockRates;
    } catch (error) {
      console.error('CoinGecko provider error:', error);
      throw error;
    }
  }
}

// Mock CoinMarketCap provider implementation
export class CoinMarketCapProvider implements ExchangeRateProvider {
  name = 'CoinMarketCap';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchRates(): Promise<ExchangeRateUpdate[]> {
    try {
      console.log('Fetching rates from CoinMarketCap (mock)...');
      
      // Mock data - replace with actual API calls
      const mockRates: ExchangeRateUpdate[] = [
        {
          currencyId: 1,
          rate: '43280.25',
          baseCurrency: 'USD',
          source: 'coinmarketcap'
        },
        {
          currencyId: 2,
          rate: '2655.30',
          baseCurrency: 'USD',
          source: 'coinmarketcap'
        }
      ];

      return mockRates;
    } catch (error) {
      console.error('CoinMarketCap provider error:', error);
      throw error;
    }
  }
}

export const exchangeRateService = new ExchangeRateService();

// Register default providers
exchangeRateService.registerProvider(new CoinGeckoProvider());

// Register CoinMarketCap if API key is available
if (process.env.COINMARKETCAP_API_KEY) {
  exchangeRateService.registerProvider(new CoinMarketCapProvider(process.env.COINMARKETCAP_API_KEY));
}