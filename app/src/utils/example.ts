import { IdGenerator } from './idGenerator.js';

// Ejemplo de uso del generador de IDs
export function demonstrateIdGenerator() {
  console.log('🆔 Ejemplos del Generador de IDs');
  console.log('=' .repeat(50));
  
  // Merchant ID
  const merchantId = IdGenerator.generateMerchantId();
  console.log(`Merchant ID: ${merchantId}`);
  
  // Wallet addresses
  const bitcoinAddress = IdGenerator.generateWalletAddress('bitcoin');
  const ethereumAddress = IdGenerator.generateWalletAddress('ethereum');
  const polygonAddress = IdGenerator.generateWalletAddress('polygon');
  
  console.log(`Bitcoin Address: ${bitcoinAddress}`);
  console.log(`Ethereum Address: ${ethereumAddress}`);
  console.log(`Polygon Address: ${polygonAddress}`);
  
  // Transaction hash
  const txHash = IdGenerator.generateTransactionHash();
  console.log(`Transaction Hash: ${txHash}`);
  
  // Different ID lengths
  const shortId = IdGenerator.generateShortId();
  const longId = IdGenerator.generateLongId();
  const customId = IdGenerator.generateId(16);
  
  console.log(`Short ID (8): ${shortId}`);
  console.log(`Long ID (32): ${longId}`);
  console.log(`Custom ID (16): ${customId}`);
  
  // Special purpose IDs
  const apiKey = IdGenerator.generateApiKey();
  const sessionId = IdGenerator.generateSessionId();
  const refId = IdGenerator.generateReferenceId();
  
  console.log(`API Key: ${apiKey}`);
  console.log(`Session ID: ${sessionId}`);
  console.log(`Reference ID: ${refId}`);
  
  // Secure strings
  const secureString = IdGenerator.generateSecureString(24);
  const filenameId = IdGenerator.generateFilenameId();
  const urlSafeId = IdGenerator.generateUrlSafeId();
  
  console.log(`Secure String (24): ${secureString}`);
  console.log(`Filename ID: ${filenameId}`);
  console.log(`URL Safe ID: ${urlSafeId}`);
  
  console.log('\n✅ Características:');
  console.log('- Sin guiones bajos (_) ni guiones (-)');
  console.log('- URL-safe');
  console.log('- Criptográficamente seguro');
  console.log('- Múltiples longitudes disponibles');
}

// Ejecutar si se llama directamente
if (import.meta.main) {
  demonstrateIdGenerator();
}
