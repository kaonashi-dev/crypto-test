import { ethers } from 'ethers';

export async function getTransactionStatus(transaction) {
    try {
        console.log(`🔍 Checking transaction status: ${transaction.id}`);
        
        // Connect to BSC testnet
        const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545');
        
        // Token contract (BUSD testnet)
        const tokenContract = new ethers.Contract(
            transaction.tokenContract,
            ['function balanceOf(address owner) view returns (uint256)', 'function decimals() view returns (uint8)'],
            provider
        );
        
        // Get current balance
        const balance = await tokenContract.balanceOf(transaction.walletAddress);
        const decimals = await tokenContract.decimals();
        const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
        
        // Check payment status
        const isCompleted = balanceFormatted >= transaction.amount;
        const status = isCompleted ? 'completed' : 'pending';
        
        const result = {
            id: transaction.id,
            status: status,
            walletAddress: transaction.walletAddress,
            expectedAmount: transaction.amount,
            receivedAmount: balanceFormatted,
            network: transaction.network,
            lastChecked: new Date().toISOString()
        };
        
        if (isCompleted) {
            result.completedAt = new Date().toISOString();
            result.excess = balanceFormatted - transaction.amount;
            console.log('✅ Payment completed!');
        } else {
            result.missingAmount = transaction.amount - balanceFormatted;
            console.log(`⏳ Payment pending. Missing: ${result.missingAmount} BUSD`);
        }
        
        console.log(`💰 Current balance: ${balanceFormatted} BUSD`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error checking status:', error.message);
        return {
            id: transaction.id,
            status: 'error',
            error: error.message,
            lastChecked: new Date().toISOString()
        };
    }
}