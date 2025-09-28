import { createTransaction } from './actions/create-trasaction';
import { getTransactionStatus } from './actions/status-trasaction';
import { simulateRealPayment } from './simulate-payment';
import { createWallet } from './actions/create-wallet';
import { checkBalance } from './actions/get-balance';
import { ethers } from 'ethers';

// const wallet1 = createWallet();
// console.log('Wallet1:', wallet1);
// const wallet2 = createWallet();
// console.log('Wallet2:', wallet2);
const wallet = {
    address: '',
    privateKey: '',
    mnemonic: "",
};

const balance = await checkBalance(wallet.address);
console.log('Balance:', balance);

// const transaction = await createTransaction(10, wallet);
// console.log('Transaction:', transaction);

// const transaction = {
//     id: "1758775954806",
//     walletAddress: "",
//     privateKey: "",
//     amount: 10,
//     tokenContract: "",
//     network: "BSC Testnet",
//     status: "pending",
//     createdAt: "2025-09-25T04:52:34.806Z",
//     paymentInstructions: {
//         sendTo: "",
//         amount: 10,
//         token: "BUSD",
//         message: "Send 10 BUSD to ",
//     },
// }
// const status = await getTransactionStatus(transaction);
// console.log('Status:', status);

// const result = await simulateRealPayment(wallet.address, 5, wallet.privateKey);
// console.log('Result:', result);
async function checkMultiNetworkBalance(address) {
    const networks = [
        { name: 'Polygon Mumbai', rpc: 'https://rpc-mumbai.maticvigil.com', symbol: 'MATIC' },
        { name: 'Avalanche Fuji', rpc: 'https://api.avax-test.network/ext/bc/C/rpc', symbol: 'AVAX' },
        { name: 'Arbitrum Sepolia', rpc: 'https://sepolia-rollup.arbitrum.io/rpc', symbol: 'ETH' }
    ];

    for (const network of networks) {
        try {
            const provider = new ethers.JsonRpcProvider(network.rpc);
            const balance = await provider.getBalance(address);
            const formatted = ethers.formatEther(balance);

            console.log(`${network.name}: ${formatted} ${network.symbol}`);
        } catch (error) {
            console.log(`${network.name}: Error checking`);
        }
    }
}

// Check balance
checkMultiNetworkBalance('');
