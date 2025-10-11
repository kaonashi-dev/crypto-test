import { db } from './index';
import { networks, currencies, exchangeRates } from './schema';

export async function seedCurrencies() {
  try {
    console.log('🌱 Seeding currencies and networks...');

    // Seed Networks
    const networkData = [
      {
        name: 'bitcoin',
        displayName: 'Bitcoin',
        symbol: 'BTC',
        chainId: null,
        rpcUrl: null,
        explorerUrl: 'https://blockstream.info',
        isTestnet: false,
        isActive: true,
        minConfirmations: 3,
        avgBlockTime: 600, // 10 minutes
      },
      {
        name: 'ethereum',
        displayName: 'Ethereum',
        symbol: 'ETH',
        chainId: 1,
        rpcUrl: 'https://mainnet.infura.io/v3/',
        explorerUrl: 'https://etherscan.io',
        isTestnet: false,
        isActive: true,
        minConfirmations: 12,
        avgBlockTime: 15, // 15 seconds
      },
      {
        name: 'polygon',
        displayName: 'Polygon',
        symbol: 'MATIC',
        chainId: 137,
        rpcUrl: 'https://polygon-mainnet.infura.io/v3/',
        explorerUrl: 'https://polygonscan.com',
        isTestnet: false,
        isActive: true,
        minConfirmations: 20,
        avgBlockTime: 2, // 2 seconds
      },
    ];

    const insertedNetworks = await db.insert(networks).values(networkData).returning();
    console.log(`✅ Inserted ${insertedNetworks.length} networks`);

    // Map network names to IDs for currency insertion
    const networkMap = new Map();
    insertedNetworks.forEach(network => {
      networkMap.set(network.name, network.id);
    });

    // Seed Currencies
    const currencyData = [
      // Bitcoin Network
      {
        networkId: networkMap.get('bitcoin'),
        name: 'Bitcoin',
        symbol: 'BTC',
        decimals: 8,
        contractAddress: null,
        tokenStandard: null,
        isNative: true,
        isStablecoin: false,
        minTransactionAmount: '0.00001',
        maxTransactionAmount: null,
        logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
        description: 'The first and most well-known cryptocurrency, created by Satoshi Nakamoto.',
        isActive: true,
      },

      // Ethereum Network
      {
        networkId: networkMap.get('ethereum'),
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        contractAddress: null,
        tokenStandard: null,
        isNative: true,
        isStablecoin: false,
        minTransactionAmount: '0.001',
        maxTransactionAmount: null,
        logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        description: 'The native currency of the Ethereum blockchain.',
        isActive: true,
      },
      {
        networkId: networkMap.get('ethereum'),
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        tokenStandard: 'ERC-20',
        isNative: false,
        isStablecoin: true,
        minTransactionAmount: '1',
        maxTransactionAmount: null,
        logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
        description: 'A stablecoin pegged to the US Dollar.',
        isActive: true,
      },
      {
        networkId: networkMap.get('ethereum'),
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        contractAddress: '0xA0b86a33E6441e64474C2642A6Fd08a2E8Ed8A8E',
        tokenStandard: 'ERC-20',
        isNative: false,
        isStablecoin: true,
        minTransactionAmount: '1',
        maxTransactionAmount: null,
        logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
        description: 'A regulated stablecoin backed by US dollars.',
        isActive: true,
      },

      // Polygon Network
      {
        networkId: networkMap.get('polygon'),
        name: 'Polygon',
        symbol: 'MATIC',
        decimals: 18,
        contractAddress: null,
        tokenStandard: null,
        isNative: true,
        isStablecoin: false,
        minTransactionAmount: '0.001',
        maxTransactionAmount: null,
        logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
        description: 'The native currency of the Polygon blockchain.',
        isActive: true,
      },
      {
        networkId: networkMap.get('polygon'),
        name: 'Tether USD (Polygon)',
        symbol: 'USDT',
        decimals: 6,
        contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        tokenStandard: 'ERC-20',
        isNative: false,
        isStablecoin: true,
        minTransactionAmount: '1',
        maxTransactionAmount: null,
        logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
        description: 'USDT on the Polygon network.',
        isActive: true,
      },
      {
        networkId: networkMap.get('polygon'),
        name: 'USD Coin (Polygon)',
        symbol: 'USDC',
        decimals: 6,
        contractAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        tokenStandard: 'ERC-20',
        isNative: false,
        isStablecoin: true,
        minTransactionAmount: '1',
        maxTransactionAmount: null,
        logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
        description: 'USDC on the Polygon network.',
        isActive: true,
      },
    ];

    const insertedCurrencies = await db.insert(currencies).values(currencyData).returning();
    console.log(`✅ Inserted ${insertedCurrencies.length} currencies`);

    // Seed Initial Exchange Rates (mock data)
    const exchangeRateData = [
      // Bitcoin
      {
        currencyId: insertedCurrencies.find(c => c.symbol === 'BTC' && c.isNative)?.id!,
        baseCurrency: 'USD',
        rate: '43250.75',
        source: 'coingecko',
        lastUpdated: new Date(),
        isActive: true,
      },
      // Ethereum
      {
        currencyId: insertedCurrencies.find(c => c.symbol === 'ETH')?.id!,
        baseCurrency: 'USD',
        rate: '2650.50',
        source: 'coingecko',
        lastUpdated: new Date(),
        isActive: true,
      },
      // USDT (Ethereum)
      {
        currencyId: insertedCurrencies.find(c => c.symbol === 'USDT' && c.contractAddress?.includes('dAC17F'))?.id!,
        baseCurrency: 'USD',
        rate: '1.000',
        source: 'coingecko',
        lastUpdated: new Date(),
        isActive: true,
      },
      // USDC (Ethereum)
      {
        currencyId: insertedCurrencies.find(c => c.symbol === 'USDC' && c.contractAddress?.includes('A0b86a'))?.id!,
        baseCurrency: 'USD',
        rate: '1.001',
        source: 'coingecko',
        lastUpdated: new Date(),
        isActive: true,
      },
      // Polygon
      {
        currencyId: insertedCurrencies.find(c => c.symbol === 'MATIC')?.id!,
        baseCurrency: 'USD',
        rate: '0.8750',
        source: 'coingecko',
        lastUpdated: new Date(),
        isActive: true,
      },
      // USDT (Polygon)
      {
        currencyId: insertedCurrencies.find(c => c.symbol === 'USDT' && c.contractAddress?.includes('c2132D'))?.id!,
        baseCurrency: 'USD',
        rate: '0.999',
        source: 'coingecko',
        lastUpdated: new Date(),
        isActive: true,
      },
      // USDC (Polygon)
      {
        currencyId: insertedCurrencies.find(c => c.symbol === 'USDC' && c.contractAddress?.includes('2791Bca'))?.id!,
        baseCurrency: 'USD',
        rate: '1.000',
        source: 'coingecko',
        lastUpdated: new Date(),
        isActive: true,
      },
    ];

    const insertedRates = await db.insert(exchangeRates).values(exchangeRateData).returning();
    console.log(`✅ Inserted ${insertedRates.length} exchange rates`);

    console.log('🎉 Currency seeding completed successfully!');
    
    return {
      networks: insertedNetworks.length,
      currencies: insertedCurrencies.length,
      exchangeRates: insertedRates.length,
    };

  } catch (error) {
    console.error('❌ Error seeding currencies:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.main) {
  seedCurrencies()
    .then((result) => {
      console.log('Seeding results:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}