import { db } from './index.js';
import { merchants, wallets } from './schema/index.js';
import { AuthService } from '../services/authService.js';
import { IdGenerator } from '../utils/idGenerator.js';
import { EncryptionService } from '../services/encryptionService.js';

// Generate encrypted private key with real private key
function generateEncryptedPrivateKey(network: string): string {
  // Generate a real private key for the network
  const privateKey = EncryptionService.generateWalletPrivateKey(network);

  // For demo purposes, store as "encrypted_<key>_<timestamp>"
  // In production, use proper encryption with a master key
  return `encrypted_${privateKey}_${Date.now()}`;
}

// Create a single merchant with wallets
export async function createMerchant(
  name: string,
  email: string,
  secret: string,
  walletNetworks: ('bitcoin' | 'ethereum' | 'polygon')[] = ['ethereum']
): Promise<{ merchant: any; credentials: { merchantId: string; secret: string } }> {
  try {

    // Generate merchant ID and hash secret
    const merchantId = AuthService.generateMerchantId();
    const hashedSecret = await AuthService.hashMerchantSecret(secret);

    // Create merchant
    const [merchant] = await db.insert(merchants).values({
      merchantId,
      name,
      email,
      merchantSecret: hashedSecret,
      status: 'active'
    }).returning();

    if (!merchant) {
      throw new Error('Failed to create merchant');
    }

    console.log(`Created merchant: ${merchant.name}`);
    console.log(`Email: ${merchant.email}`);
    console.log(`Merchant ID: ${merchant.merchantId}`);

    // Create wallets for this merchant
    const createdWallets = [];
    for (const network of walletNetworks) {
      const [wallet] = await db.insert(wallets).values({
        merchantId: merchant.id,
        address: IdGenerator.generateWalletAddress(network),
        privateKeyEncrypted: generateEncryptedPrivateKey(network),
        network,
        balance: '0',
        status: 'active'
      }).returning();

      if (!wallet) {
        throw new Error(`Failed to create ${network} wallet`);
      }

      createdWallets.push(wallet);
      console.log(`   💰 Created ${network} wallet: ${wallet.address}`);
    }

    return {
      merchant: { ...merchant, wallets: createdWallets },
      credentials: { merchantId, secret }
    };

  } catch (error) {
    console.error(`❌ Error creating merchant ${name}:`, error);
    throw error;
  }
}

// CLI interface for creating merchants
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: bun src/db/createMerchant.ts <name> <email> <secret> [networks...]');
    console.log('Example: bun src/db/createMerchant.ts "My Company" "admin@mycompany.com" "MySecret123!" bitcoin ethereum');
    process.exit(1);
  }

  const [name, email, secret, ...networks] = args;

  if (!name || !email || !secret) {
    console.error('❌ Missing required arguments: name, email, and secret are required');
    process.exit(1);
  }

  const walletNetworks: ('bitcoin' | 'ethereum' | 'polygon')[] = networks.length > 0
    ? networks.filter(network => ['bitcoin', 'ethereum', 'polygon'].includes(network)) as ('bitcoin' | 'ethereum' | 'polygon')[]
    : ['ethereum'];

  createMerchant(name, email, secret, walletNetworks)
    .then(({ merchant, credentials }) => {
      console.log('\n🎉 Merchant created successfully!');
      console.log('\n📋 Merchant Details:');
      console.log('=' .repeat(60));
      console.log(`   📧 Email: ${merchant.email}`);
      console.log(`   🆔 Merchant ID: ${credentials.merchantId}`);
      console.log(`   🔑 Secret: ${credentials.secret}`);
      console.log(`   📊 Status: ${merchant.status}`);
      console.log(`   📅 Created: ${merchant.createdAt.toISOString()}`);
      console.log(`   💰 Wallets: ${merchant.wallets.map((w: any) => `${w.network} (${w.balance})`).join(', ')}`);

      console.log('\n🔑 Authentication Headers:');
      console.log(`   X-Merchant-ID: ${credentials.merchantId}`);
      console.log(`   Merchant-Secret: ${credentials.secret}`);

      console.log('\n🧪 Test Authentication Command:');
      console.log(`curl -X POST http://localhost:3000/auth/token \\`);
      console.log(`  -H "X-Merchant-ID: ${credentials.merchantId}" \\`);
      console.log(`  -H "Merchant-Secret: ${credentials.secret}"`);
      console.log('=' .repeat(60));
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create merchant:', error);
      process.exit(1);
    });
}
