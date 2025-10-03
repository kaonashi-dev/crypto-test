import { TronService } from '../services/tron.service.ts';

async function tronExample() {
  // Initialize service (testnet by default)
  const tronService = new TronService('testnet');

  // Create a new wallet
  const wallet = await tronService.createWallet();
  console.log('New Wallet:', wallet);

  // Get TRX balance
  const trxBalance = await tronService.getTRXBalance(wallet.address);
  console.log('TRX Balance:', trxBalance);

  // Get USDT balance
  const usdtBalance = await tronService.getUSDTBalance(wallet.address);
  console.log('USDT Balance:', usdtBalance);

  // Transfer TRX (only if you have balance)
  // const txResult = await tronService.transferTRX(wallet, 'RECIPIENT_ADDRESS', 10);
  // console.log('Transfer Result:', txResult);

  // Transfer USDT (only if you have balance)
  // const usdtTxResult = await tronService.transferUSDT(wallet, 'RECIPIENT_ADDRESS', 5, true);
  // console.log('USDT Transfer Result:', usdtTxResult);

  // Get transaction status
  // const txStatus = await tronService.getTransactionStatus('TX_ID');
  // console.log('Transaction Status:', txStatus);
}

// Run example
// tronExample().catch(console.error);
