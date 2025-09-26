import { ethers } from 'ethers';

export function createWallet() {
    try {
        // Generate random wallet
        const wallet = ethers.Wallet.createRandom();

        // Return wallet data
        const walletData = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic?.phrase,
            network: 'BSC Testnet',
            createdAt: new Date().toISOString()
        };

        console.log('Wallet created:', {
            address: walletData.address,
            network: walletData.network
        });

        return walletData;

    } catch (error) {
        console.error('Error creating wallet:', error.message);
        throw error;
    }
}