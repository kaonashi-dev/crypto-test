import { db } from '@/db';
import { networks, currencies, exchangeRates } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { ApiResponse } from '@/types';

export interface NetworkWithCurrencies {
  id: number;
  name: string;
  displayName: string;
  symbol: string;
  chainId?: number;
  rpcUrl?: string;
  explorerUrl?: string;
  isTestnet: boolean;
  isActive: boolean;
  minConfirmations: number;
  avgBlockTime: number;
  currencies: CurrencyWithRate[];
}

export interface CurrencyWithRate {
  id: number;
  name: string;
  symbol: string;
  decimals: number;
  contractAddress?: string;
  tokenStandard?: string;
  isNative: boolean;
  isStablecoin: boolean;
  minTransactionAmount: string;
  maxTransactionAmount?: string;
  logoUrl?: string;
  description?: string;
  exchangeRate?: {
    rate: string;
    baseCurrency: string;
    lastUpdated: Date;
    source: string;
  };
}

export interface ConversionRequest {
  amount: string;
  fromCurrencyId: number;
  toCurrencyId: number;
}

export interface ConversionResult {
  originalAmount: string;
  convertedAmount: string;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: string;
  lastUpdated: Date;
}

export class CurrencyService {
  // Get all active networks with their currencies
  async getNetworksWithCurrencies(): Promise<ApiResponse<NetworkWithCurrencies[]>> {
    try {
      const networksData = await db
        .select()
        .from(networks)
        .where(eq(networks.isActive, true));

      const result: NetworkWithCurrencies[] = [];

      for (const network of networksData) {
        const currenciesData = await db
          .select({
            id: currencies.id,
            name: currencies.name,
            symbol: currencies.symbol,
            decimals: currencies.decimals,
            contractAddress: currencies.contractAddress,
            tokenStandard: currencies.tokenStandard,
            isNative: currencies.isNative,
            isStablecoin: currencies.isStablecoin,
            minTransactionAmount: currencies.minTransactionAmount,
            maxTransactionAmount: currencies.maxTransactionAmount,
            logoUrl: currencies.logoUrl,
            description: currencies.description,
          })
          .from(currencies)
          .where(
            and(
              eq(currencies.networkId, network.id),
              eq(currencies.isActive, true)
            )
          );

        // Get exchange rates for currencies
        const currenciesWithRates: CurrencyWithRate[] = [];
        
        for (const currency of currenciesData) {
          const [latestRate] = await db
            .select({
              rate: exchangeRates.rate,
              baseCurrency: exchangeRates.baseCurrency,
              lastUpdated: exchangeRates.lastUpdated,
              source: exchangeRates.source,
            })
            .from(exchangeRates)
            .where(
              and(
                eq(exchangeRates.currencyId, currency.id),
                eq(exchangeRates.isActive, true)
              )
            )
            .orderBy(desc(exchangeRates.lastUpdated))
            .limit(1);

          currenciesWithRates.push({
            ...currency,
            contractAddress: currency.contractAddress ?? null,
            tokenStandard: currency.tokenStandard ?? null,
            maxTransactionAmount: currency.maxTransactionAmount ?? null,
            logoUrl: currency.logoUrl ?? null,
            description: currency.description ?? null,
            exchangeRate: latestRate || undefined
          });
        }

        result.push({
          ...network,
          currencies: currenciesWithRates
        });
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error getting networks with currencies:', error);
      return {
        success: false,
        error: 'Failed to retrieve networks and currencies'
      };
    }
  }

  // Get currencies for a specific network
  async getCurrenciesByNetwork(networkName: string): Promise<ApiResponse<CurrencyWithRate[]>> {
    try {
      const [network] = await db
        .select()
        .from(networks)
        .where(and(eq(networks.name, networkName), eq(networks.isActive, true)))
        .limit(1);

      if (!network) {
        return {
          success: false,
          error: 'Network not found or inactive'
        };
      }

      const currenciesData = await db
        .select()
        .from(currencies)
        .where(
          and(
            eq(currencies.networkId, network.id),
            eq(currencies.isActive, true)
          )
        );

      const result: CurrencyWithRate[] = [];

      for (const currency of currenciesData) {
        const [latestRate] = await db
          .select({
            rate: exchangeRates.rate,
            baseCurrency: exchangeRates.baseCurrency,
            lastUpdated: exchangeRates.lastUpdated,
            source: exchangeRates.source,
          })
          .from(exchangeRates)
          .where(
            and(
              eq(exchangeRates.currencyId, currency.id),
              eq(exchangeRates.isActive, true)
            )
          )
          .orderBy(desc(exchangeRates.lastUpdated))
          .limit(1);

        result.push({
          id: currency.id,
          name: currency.name,
          symbol: currency.symbol,
          decimals: currency.decimals,
          contractAddress: currency.contractAddress ?? null,
          tokenStandard: currency.tokenStandard ?? null,
          isNative: currency.isNative,
          isStablecoin: currency.isStablecoin,
          minTransactionAmount: currency.minTransactionAmount,
          maxTransactionAmount: currency.maxTransactionAmount ?? null,
          logoUrl: currency.logoUrl ?? null,
          description: currency.description ?? null,
          exchangeRate: latestRate || undefined
        });
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error getting currencies by network:', error);
      return {
        success: false,
        error: 'Failed to retrieve currencies for network'
      };
    }
  }

  // Get exchange rates for all currencies
  async getExchangeRates(baseCurrency: string = 'USD'): Promise<ApiResponse<any[]>> {
    try {
      const rates = await db
        .select({
          currencyId: exchangeRates.currencyId,
          currencySymbol: currencies.symbol,
          currencyName: currencies.name,
          rate: exchangeRates.rate,
          baseCurrency: exchangeRates.baseCurrency,
          lastUpdated: exchangeRates.lastUpdated,
          source: exchangeRates.source,
        })
        .from(exchangeRates)
        .innerJoin(currencies, eq(exchangeRates.currencyId, currencies.id))
        .where(
          and(
            eq(exchangeRates.baseCurrency, baseCurrency.toUpperCase()),
            eq(exchangeRates.isActive, true)
          )
        )
        .orderBy(desc(exchangeRates.lastUpdated));

      // Get only the latest rate for each currency
      const latestRates = new Map();
      rates.forEach(rate => {
        if (!latestRates.has(rate.currencyId) || 
            new Date(rate.lastUpdated) > new Date(latestRates.get(rate.currencyId).lastUpdated)) {
          latestRates.set(rate.currencyId, rate);
        }
      });

      return {
        success: true,
        data: Array.from(latestRates.values())
      };
    } catch (error) {
      console.error('Error getting exchange rates:', error);
      return {
        success: false,
        error: 'Failed to retrieve exchange rates'
      };
    }
  }

  // Convert between currencies
  async convertCurrency(request: ConversionRequest): Promise<ApiResponse<ConversionResult>> {
    try {
      // Get source and target currencies with their latest rates
      const [fromCurrency] = await db
        .select()
        .from(currencies)
        .where(eq(currencies.id, request.fromCurrencyId))
        .limit(1);

      const [toCurrency] = await db
        .select()
        .from(currencies)
        .where(eq(currencies.id, request.toCurrencyId))
        .limit(1);

      if (!fromCurrency || !toCurrency) {
        return {
          success: false,
          error: 'One or both currencies not found'
        };
      }

      // Get latest exchange rates for both currencies
      const [fromRate] = await db
        .select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.currencyId, request.fromCurrencyId),
            eq(exchangeRates.isActive, true)
          )
        )
        .orderBy(desc(exchangeRates.lastUpdated))
        .limit(1);

      const [toRate] = await db
        .select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.currencyId, request.toCurrencyId),
            eq(exchangeRates.isActive, true)
          )
        )
        .orderBy(desc(exchangeRates.lastUpdated))
        .limit(1);

      if (!fromRate || !toRate) {
        return {
          success: false,
          error: 'Exchange rates not available for one or both currencies'
        };
      }

      // Convert: amount * (fromRate / toRate)
      const amount = parseFloat(request.amount);
      const fromRateValue = parseFloat(fromRate.rate);
      const toRateValue = parseFloat(toRate.rate);
      
      const convertedAmount = (amount * fromRateValue) / toRateValue;
      const exchangeRateUsed = fromRateValue / toRateValue;

      const result: ConversionResult = {
        originalAmount: request.amount,
        convertedAmount: convertedAmount.toFixed(8),
        fromCurrency: fromCurrency.symbol,
        toCurrency: toCurrency.symbol,
        exchangeRate: exchangeRateUsed.toFixed(8),
        lastUpdated: new Date(Math.max(
          new Date(fromRate.lastUpdated).getTime(),
          new Date(toRate.lastUpdated).getTime()
        ))
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error converting currency:', error);
      return {
        success: false,
        error: 'Failed to convert currency'
      };
    }
  }

  // Get supported networks only
  async getSupportedNetworks(): Promise<ApiResponse<any[]>> {
    try {
      const networksData = await db
        .select({
          id: networks.id,
          name: networks.name,
          displayName: networks.displayName,
          symbol: networks.symbol,
          chainId: networks.chainId,
          explorerUrl: networks.explorerUrl,
          isTestnet: networks.isTestnet,
          minConfirmations: networks.minConfirmations,
          avgBlockTime: networks.avgBlockTime,
        })
        .from(networks)
        .where(eq(networks.isActive, true));

      return {
        success: true,
        data: networksData
      };
    } catch (error) {
      console.error('Error getting supported networks:', error);
      return {
        success: false,
        error: 'Failed to retrieve supported networks'
      };
    }
  }
}

export const currencyService = new CurrencyService();