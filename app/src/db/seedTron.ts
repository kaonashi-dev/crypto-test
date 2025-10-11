import { db } from './index';
import { networks, currencies, exchangeRates } from './schema';
import { eq, and } from 'drizzle-orm';

export async function seedTron() {
  try {
    console.log('🌱 Seeding Tron network and currencies...');

    // Check if Tron network already exists
    const existingTron = await db
      .select()
      .from(networks)
      .where(eq(networks.name, 'tron'))
      .limit(1);

    let tronNetwork;
    
    if (existingTron.length === 0) {
      // Insert Tron Network
      const tronNetworkData = {
        name: 'tron',
        displayName: 'Tron',
        symbol: 'TRX',
        chainId: null, // Tron doesn't use chainId like EVM networks
        rpcUrl: 'https://api.trongrid.io',
        explorerUrl: 'https://tronscan.org',
        isTestnet: false,
        isActive: true,
        minConfirmations: 19, // Tron requires 19 confirmations
        avgBlockTime: 3, // 3 seconds average block time
      };

      const [insertedTron] = await db.insert(networks).values(tronNetworkData).returning();
      tronNetwork = insertedTron;
      console.log('✅ Inserted Tron network');
    } else {
      tronNetwork = existingTron[0];
      console.log('✅ Tron network already exists');
    }

    // Check if TRX currency already exists
    const existingTRX = await db
      .select()
      .from(currencies)
      .where(
        and(
          eq(currencies.networkId, tronNetwork.id),
          eq(currencies.symbol, 'TRX'),
          eq(currencies.isNative, true)
        )
      )
      .limit(1);

    let trxCurrency;
    
    if (existingTRX.length === 0) {
      // Insert TRX (native currency)
      const trxData = {
        networkId: tronNetwork.id,
        name: 'Tron',
        symbol: 'TRX',
        decimals: 6, // TRX has 6 decimal places
        contractAddress: null,
        tokenStandard: null,
        isNative: true,
        isStablecoin: false,
        minTransactionAmount: '1', // Minimum 1 TRX
        maxTransactionAmount: null,
        logoUrl: 'https://cryptologos.cc/logos/tron-trx-logo.png',
        description: 'The native currency of the Tron blockchain.',
        isActive: true,
      };

      const [insertedTRX] = await db.insert(currencies).values(trxData).returning();
      trxCurrency = insertedTRX;
      console.log('✅ Inserted TRX currency');
    } else {
      trxCurrency = existingTRX[0];
      console.log('✅ TRX currency already exists');
    }

    // Check if USDT on Tron already exists
    const existingUSDT = await db
      .select()
      .from(currencies)
      .where(
        and(
          eq(currencies.networkId, tronNetwork.id),
          eq(currencies.symbol, 'USDT'),
          eq(currencies.contractAddress, 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')
        )
      )
      .limit(1);

    let usdtCurrency;
    
    if (existingUSDT.length === 0) {
      // Insert USDT on Tron
      const usdtData = {
        networkId: tronNetwork.id,
        name: 'Tether USD (Tron)',
        symbol: 'USDT',
        decimals: 6,
        contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // Official USDT contract on Tron
        tokenStandard: 'TRC-20',
        isNative: false,
        isStablecoin: true,
        minTransactionAmount: '1', // Minimum 1 USDT
        maxTransactionAmount: null,
        logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
        description: 'USDT stablecoin on the Tron network (TRC-20).',
        isActive: true,
      };

      const [insertedUSDT] = await db.insert(currencies).values(usdtData).returning();
      usdtCurrency = insertedUSDT;
      console.log('✅ Inserted USDT on Tron');
    } else {
      usdtCurrency = existingUSDT[0];
      console.log('✅ USDT on Tron already exists');
    }

    // Seed Exchange Rates for Tron currencies
    const exchangeRateData = [];

    // Check if TRX rate already exists
    const existingTRXRate = await db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.currencyId, trxCurrency.id),
          eq(exchangeRates.baseCurrency, 'USD'),
          eq(exchangeRates.isActive, true)
        )
      )
      .limit(1);

    if (existingTRXRate.length === 0) {
      exchangeRateData.push({
        currencyId: trxCurrency.id,
        baseCurrency: 'USD',
        rate: '0.1250', // Mock rate for TRX
        source: 'coingecko',
        lastUpdated: new Date(),
        isActive: true,
      });
    }

    // Check if USDT rate already exists
    const existingUSDTRate = await db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.currencyId, usdtCurrency.id),
          eq(exchangeRates.baseCurrency, 'USD'),
          eq(exchangeRates.isActive, true)
        )
      )
      .limit(1);

    if (existingUSDTRate.length === 0) {
      exchangeRateData.push({
        currencyId: usdtCurrency.id,
        baseCurrency: 'USD',
        rate: '1.000', // USDT should be close to $1
        source: 'coingecko',
        lastUpdated: new Date(),
        isActive: true,
      });
    }

    if (exchangeRateData.length > 0) {
      const insertedRates = await db.insert(exchangeRates).values(exchangeRateData).returning();
      console.log(`✅ Inserted ${insertedRates.length} exchange rates for Tron currencies`);
    } else {
      console.log('✅ Exchange rates for Tron currencies already exist');
    }

    console.log('🎉 Tron seeding completed successfully!');
    
    return {
      network: tronNetwork,
      currencies: [trxCurrency, usdtCurrency],
      exchangeRates: exchangeRateData.length,
    };

  } catch (error) {
    console.error('❌ Error seeding Tron:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.main) {
  seedTron()
    .then((result) => {
      console.log('Tron seeding results:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Tron seeding failed:', error);
      process.exit(1);
    });
}
