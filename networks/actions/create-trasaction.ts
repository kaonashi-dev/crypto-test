import { ethers } from 'ethers';

export async function createTransaction(amountUSDT = 1, wallet: any) {
    try {
        console.log(`💳 Creating transaction for ${amountUSDT} tokens...`);
        
        // Connect to BSC testnet
        const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545');
        
        // Transaction data
        const transaction = {
            id: Date.now().toString(),
            walletAddress: wallet.address,
            privateKey: wallet.privateKey,
            amount: amountUSDT,
            tokenContract: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee', // BUSD testnet
            network: 'BSC Testnet',
            status: 'pending',
            createdAt: new Date().toISOString(),
            
            // Payment instructions
            paymentInstructions: {
                sendTo: wallet.address,
                amount: amountUSDT,
                token: 'BUSD',
                message: `Send ${amountUSDT} BUSD to ${wallet.address}`
            }
        };
        
        console.log('✅ Transaction created:', {
            id: transaction.id,
            address: transaction.walletAddress,
            amount: `${transaction.amount} BUSD`,
            network: transaction.network
        });
        
        return transaction;
        
    } catch (error) {
        console.error('❌ Error creating transaction:', error.message);
        throw error;
    }
}