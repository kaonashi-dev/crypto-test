import { ethers } from 'ethers';

export async function checkBalance(address: string, token = 'both') {
    try {
        const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545');
        const balances = {};
        
        // Check BNB balance
        if (token === 'both' || token === 'bnb') {
            const bnbBalance = await provider.getBalance(address);
            balances.bnb = {
                raw: bnbBalance.toString(),
                formatted: ethers.formatEther(bnbBalance),
                symbol: 'tBNB'
            };
        }
        
        // Check BUSD balance
        if (token === 'both' || token === 'busd') {
            const busdContract = new ethers.Contract(
                '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
                [
                    'function balanceOf(address owner) view returns (uint256)',
                    'function decimals() view returns (uint8)'
                ],
                provider
            );
            
            const busdBalance = await busdContract.balanceOf(address);
            const decimals = await busdContract.decimals();
            
            balances.busd = {
                raw: busdBalance.toString(),
                formatted: ethers.formatUnits(busdBalance, decimals),
                symbol: 'BUSD',
                decimals: decimals.toString()
            };
        }
        
        console.log(`Balances for ${address}:`);
        if (balances.bnb) {
            console.log(`  ${balances.bnb.symbol}: ${balances.bnb.formatted}`);
        }
        if (balances.busd) {
            console.log(`  BUSD: ${balances.busd.formatted}`);
        }
        
        return balances;
        
    } catch (error) {
        console.error('Error checking balance:', error.message);
        throw error;
    }
}