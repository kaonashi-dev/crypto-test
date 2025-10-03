import { BSCPaymentService } from '../services/bsc.service.ts';

async function bscExample() {
  // Initialize payment system (testnet by default)
  const paymentSystem = new BSCPaymentService('testnet');

  try {
    console.log('\n=== TEST CONNECTION ===');
    const connected = await paymentSystem.testConnection();
    if (!connected) {
      console.error('❌ Could not connect');
      return;
    }

    console.log('\n=== CREATE WALLET ===');
    const wallet = paymentSystem.createWallet();
    console.log('Wallet:', wallet);

    console.log('\n=== CHECK BALANCES ===');
    await paymentSystem.checkBalance(wallet.address);

    console.log('\n=== CREATE TRANSACTION ===');
    const transaction = await paymentSystem.createTransaction(
      1, // 1 USDT
      wallet,
      'Test payment',
      60 // 60 minutes expiration
    );

    console.log('\n=== CHECK STATUS ===');
    const status = await paymentSystem.getTransactionStatus(transaction.id);
    console.log('Status:', status);

    console.log('\n🎉 System ready! Important data:');
    console.log(`📄 Transaction ID: ${transaction.id}`);
    console.log(`💰 Amount: ${transaction.amount} USDT`);
    console.log(`📍 Payment address: ${transaction.paymentAddress}`);
    console.log(`🔗 Explorer: ${transaction.explorerUrl}`);

    return { paymentSystem, wallet, transaction };
  } catch (error) {
    console.error('❌ Error in example:', error);
  }
}

// Run example
// bscExample().catch(console.error);
