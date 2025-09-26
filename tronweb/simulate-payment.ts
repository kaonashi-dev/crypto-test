import { ethers } from 'ethers';

export async function simulateRealPayment(toAddress: string, amount: number, senderPrivateKey: string) {
    try {
        console.log(`💸 Simulating real payment: ${amount} BUSD to ${toAddress}`);

        // Connect to BSC testnet
        const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545');

        // Create sender wallet from private key
        const senderWallet = new ethers.Wallet(senderPrivateKey, provider);

        // BUSD testnet contract
        const busdContract = new ethers.Contract(
            '',
            [
                'function transfer(address to, uint256 amount) returns (bool)',
                'function balanceOf(address owner) view returns (uint256)',
                'function decimals() view returns (uint8)'
            ],
            senderWallet
        );

        // Check sender balance
        const balance = await busdContract.balanceOf(senderWallet.address);
        const decimals = await busdContract.decimals();
        const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));

        console.log(`💰 Sender balance: ${balanceFormatted} BUSD`);

        if (balanceFormatted < amount) {
            throw new Error(`Insufficient balance. Need ${amount}, have ${balanceFormatted}`);
        }

        // Send payment
        const transferAmount = ethers.parseUnits(amount.toString(), decimals);
        const tx = await busdContract.transfer(toAddress, transferAmount);

        console.log(`📤 Transaction sent: ${tx.hash}`);
        console.log(`⏳ Waiting for confirmation...`);

        // Wait for confirmation
        const receipt = await tx.wait();

        console.log(`✅ Payment confirmed!`);
        console.log(`📍 Block: ${receipt.blockNumber}`);
        console.log(`💸 Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`🔗 View on BSCScan: https://testnet.bscscan.com/tx/${tx.hash}`);

        return {
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            amount: amount,
            to: toAddress,
            from: senderWallet.address
        };

    } catch (error) {
        console.error('❌ Error simulating payment:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}
