import { EthereumService } from '../services/ethereum.service.ts';
import type { NetworkType } from '../types/network.types.ts';

async function ethereumExample() {
  // Initialize service (default: public network)
  const ethService = new EthereumService('public' as NetworkType);

  // Create a new wallet
  const wallet = ethService.createWallet();
  console.log('New Wallet:', wallet);

  // Get ETH balance
  const ethBalance = await ethService.getETHBalance(wallet.address);
  console.log('ETH Balance:', ethBalance);

  // Get USDT balance
  const usdtBalance = await ethService.getUSDTBalance(wallet.address);
  console.log('USDT Balance:', usdtBalance);

  // Get network info
  const networkInfo = await ethService.getNetworkInfo();
  console.log('Network Info:', networkInfo);

  // Estimate gas for a transfer
  const gasEstimate = await ethService.estimateGas(
    wallet.address,
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    0.01
  );
  console.log('Gas Estimate:', gasEstimate);

  // Transfer ETH (only if you have balance)
  // const txResult = await ethService.transferETH(wallet, 'RECIPIENT_ADDRESS', 0.001);
  // console.log('Transfer Result:', txResult);

  // Get transaction status
  // const txStatus = await ethService.getTransactionStatus('TX_HASH');
  // console.log('Transaction Status:', txStatus);
}

// Run example
// ethereumExample().catch(console.error);
