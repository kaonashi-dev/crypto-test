import { db } from './index.js';
import { merchants, wallets, transactions, usersBackoffice } from './schema/index.js';
import { AuthService } from '../services/authService.js';
import { IdGenerator } from '../utils/idGenerator.js';
import { EncryptionService } from '../services/encryptionService.js';
import bcrypt from 'bcrypt';

// Test data configuration
const TEST_MERCHANTS = [
  {
    name: 'Crypto Exchange Pro',
    email: 'admin@cryptoexchange.com',
    secret: 'SecurePass123!',
    wallets: [
      { network: 'bitcoin', balance: '1.5' },
      { network: 'ethereum', balance: '10.0' },
      { network: 'polygon', balance: '1000.0' }
    ]
  },
  {
    name: 'Digital Wallet Solutions',
    email: 'contact@digitalwallet.com',
    secret: 'MySecurePassword456!',
    wallets: [
      { network: 'bitcoin', balance: '0.8' },
      { network: 'ethereum', balance: '5.5' }
    ]
  },
  {
    name: 'Blockchain Payments Inc',
    email: 'info@blockchainpayments.com',
    secret: 'SuperSecret789!',
    wallets: [
      { network: 'ethereum', balance: '25.0' },
      { network: 'polygon', balance: '5000.0' }
    ]
  }
];

const SAMPLE_TRANSACTIONS = [
  {
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    amount: '0.1',
    type: 'receive' as const,
    status: 'confirmed' as const,
    fromAddress: '0x0000000000000000000000000000000000000000',
    toAddress: '0x1111111111111111111111111111111111111111',
    blockNumber: 18500000,
    gasUsed: '21000',
    gasPrice: '20000000000'
  },
  {
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    amount: '0.05',
    type: 'send' as const,
    status: 'pending' as const,
    fromAddress: '0x2222222222222222222222222222222222222222',
    toAddress: '0x3333333333333333333333333333333333333333',
    blockNumber: 18500001,
    gasUsed: '21000',
    gasPrice: '25000000000'
  }
];

// Generate encrypted private key with real private key
function generateEncryptedPrivateKey(network: string): string {
  // Generate a real private key for the network
  const privateKey = EncryptionService.generateWalletPrivateKey(network);

  // For demo purposes, store as "encrypted_<key>_<timestamp>"
  // In production, use proper encryption with a master key
  return `encrypted_${privateKey}_${Date.now()}`;
}

// Clear existing data
async function clearDatabase(): Promise<void> {
  console.log('🧹 Clearing existing data...');

  try {
    // Delete in reverse order due to foreign key constraints
    await db.delete(transactions);
    await db.delete(wallets);
    await db.delete(usersBackoffice);
    await db.delete(merchants);

    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

// Seed merchants and their wallets
async function seedMerchants(): Promise<void> {
  console.log('👥 Creating test merchants...');

  for (const merchantData of TEST_MERCHANTS) {
    try {
      // Generate merchant ID and hash secret
      const merchantId = AuthService.generateMerchantId();
      const hashedSecret = await AuthService.hashMerchantSecret(merchantData.secret);

      // Create merchant
      const [merchant] = await db.insert(merchants).values({
        merchantId,
        name: merchantData.name,
        email: merchantData.email,
        merchantSecret: hashedSecret,
        status: 'active'
      }).returning();

      if (!merchant) {
        throw new Error(`Failed to create merchant: ${merchantData.name}`);
      }

      console.log(`✅ Created merchant: ${merchant.name}`);
      console.log(`   📧 Email: ${merchant.email}`);
      console.log(`   🆔 Merchant ID: ${merchant.merchantId}`);
      console.log(`   🔑 Secret: ${merchantData.secret}`);
      console.log(`   📊 Status: ${merchant.status}`);
      console.log(`   📅 Created: ${merchant.createdAt.toISOString()}`);

      // Create wallets for this merchant
      for (const walletData of merchantData.wallets) {
        // Map network to coin based on the network
        const getCoinForNetwork = (network: string): string => {
          switch (network.toLowerCase()) {
            case 'bitcoin':
              return 'BTC';
            case 'ethereum':
              return 'ETH';
            case 'polygon':
              return 'MATIC';
            default:
              throw new Error(`Unknown network: ${network}`);
          }
        };

        const [wallet] = await db.insert(wallets).values({
          merchantId: merchant.id,
          address: IdGenerator.generateWalletAddress(walletData.network as 'bitcoin' | 'ethereum' | 'polygon'),
          privateKeyEncrypted: generateEncryptedPrivateKey(walletData.network),
          network: walletData.network,
          coin: getCoinForNetwork(walletData.network),
          balance: walletData.balance,
          status: 'active'
        }).returning();

        if (!wallet) {
          throw new Error(`Failed to create ${walletData.network} wallet for merchant: ${merchant.name}`);
        }

        console.log(`   💰 Created ${walletData.network} wallet: ${wallet.address} (Balance: ${walletData.balance})`);
      }

    } catch (error) {
      console.error(`❌ Error creating merchant ${merchantData.name}:`, error);
      throw error;
    }
  }
}

// Seed backoffice users for each merchant
async function seedBackofficeUsers(): Promise<void> {

  try {
    // Get all merchants to create users for them
    const allMerchants = await db.select().from(merchants);

    if (allMerchants.length === 0) {
      console.log('⚠️  No merchants found, skipping backoffice user creation');
      return;
    }

    for (const merchant of allMerchants) {
      // Create 2-3 users per merchant with different roles
      const users = [
        {
          email: `admin@${merchant.email.split('@')[1]}`,
          password: 'admin123',
          name: `${merchant.name} Admin`,
        },
        {
          email: `manager@${merchant.email.split('@')[1]}`,
          password: 'manager123',
          name: `${merchant.name} Manager`,
        },
        {
          email: `support@${merchant.email.split('@')[1]}`,
          password: 'support123',
          name: `${merchant.name} Support`,
        }
      ];

      for (const userData of users) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const [user] = await db.insert(usersBackoffice).values({
          merchantId: merchant.id,
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          isActive: true
        }).returning();

        if (!user) {
          throw new Error(`Failed to create user: ${userData.email}`);
        }

        console.log(`✅ Created user: ${user.email} for merchant ${merchant.name}`);
      }
    }

  } catch (error) {
    console.error('❌ Error creating backoffice users:', error);
    throw error;
  }
}

// Seed sample transactions
async function seedTransactions(): Promise<void> {
  console.log('💸 Creating sample transactions...');

  try {
    // Get all wallets to assign transactions
    const allWallets = await db.select().from(wallets);

    if (allWallets.length === 0) {
      console.log('⚠️  No wallets found, skipping transaction creation');
      return;
    }

    for (let i = 0; i < SAMPLE_TRANSACTIONS.length; i++) {
      const txData = SAMPLE_TRANSACTIONS[i];
      if (!txData) continue;

      const wallet = allWallets[i % allWallets.length]; // Distribute transactions across wallets
      if (!wallet) continue;

      const [transaction] = await db.insert(transactions).values({
        walletId: wallet.id,
        txHash: txData.txHash,
        amount: txData.amount,
        type: txData.type,
        status: txData.status,
        fromAddress: txData.fromAddress,
        toAddress: txData.toAddress,
        blockNumber: txData.blockNumber,
        gasUsed: txData.gasUsed,
        gasPrice: txData.gasPrice
      }).returning();

      if (!transaction) {
        throw new Error(`Failed to create transaction: ${txData.txHash}`);
      }

      console.log(`✅ Created transaction: ${transaction.txHash} (${transaction.type} ${transaction.amount})`);
    }

  } catch (error) {
    console.error('❌ Error creating transactions:', error);
    throw error;
  }
}

// Main seed function
export async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // Test database connection
    await db.select().from(merchants).limit(1);
    console.log('✅ Database connection verified');

    // Clear existing data
    await clearDatabase();

    // Seed merchants and wallets
    await seedMerchants();

    // Seed backoffice users
    await seedBackofficeUsers();

    // Seed transactions
    await seedTransactions();

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   👥 Merchants created: ${TEST_MERCHANTS.length}`);
    console.log(`   👤 Backoffice users created: ${TEST_MERCHANTS.length * 3}`);
    console.log(`   💰 Total wallets created: ${TEST_MERCHANTS.reduce((sum, m) => sum + m.wallets.length, 0)}`);
    console.log(`   💸 Sample transactions created: ${SAMPLE_TRANSACTIONS.length}`);

    console.log('\n🔑 Test credentials for authentication:');
    console.log('=' .repeat(80));

    // Get all created merchants to show their actual IDs
    const allMerchants = await db.select().from(merchants);

    allMerchants.forEach((merchant, index) => {
      const originalData = TEST_MERCHANTS[index];
      if (!originalData) return;

      console.log(`\n${index + 1}. ${merchant.name}`);
      console.log(`   📧 Email: ${merchant.email}`);
      console.log(`   🆔 Merchant ID: ${merchant.merchantId}`);
      console.log(`   🔑 Secret: ${originalData.secret}`);
      console.log(`   📊 Status: ${merchant.status}`);
      console.log(`   📅 Created: ${merchant.createdAt.toISOString()}`);
      console.log(`   💰 Wallets: ${originalData.wallets.map(w => `${w.network} (${w.balance})`).join(', ')}`);

      console.log(`\n   🧪 Test authentication:`);
      console.log(`   curl -X POST http://localhost:3000/auth/token \\`);
      console.log(`     -H "X-Merchant-ID: ${merchant.merchantId}" \\`);
      console.log(`     -H "Merchant-Secret: ${originalData.secret}"`);

      console.log(`\n   👤 Backoffice Users:`);
      console.log(`     admin@${merchant.email.split('@')[1]} (password: admin123)`);
      console.log(`     manager@${merchant.email.split('@')[1]} (password: manager123)`);
      console.log(`     support@${merchant.email.split('@')[1]} (password: support123)`);
      console.log('   ' + '-'.repeat(60));
    });

  } catch (error) {
    console.error('💥 Database seeding failed:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.main) {
  seedDatabase()
    .then(() => {
      console.log('✨ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}
