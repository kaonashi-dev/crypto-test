const { ethers } = require('ethers');

const INFURA_API_KEY = Bun.env.INFURA_API_KEY;
const CONTRACTS = {
    // BSC Mainnet
    mainnet: {
        url: `https://bsc-mainnet.infura.io/v3/`,
        chainId: 56,
        name: 'BSC Mainnet',
        usdt: '0x55d398326f99059fF775485246999027B3197955',
        nativeCurrency: 'BNB'
    },
    // BSC Testnet (testnet)
    testnet: {
        url: `https://bsc-testnet.infura.io/v3/`,
        chainId: 97,
        name: 'BSC Testnet',
        usdt: '0x7ef95a0FEE0Dd31b22626fF2be2D0E46E29c4e00',
        nativeCurrency: 'tBNB'
    }
};
const defaultNetwork = CONTRACTS.testnet;
const walletMain = {
    address: '',
    privateKey: '',
    mnemonic: '',
    wallet: createNewWallet().wallet,
    network: defaultNetwork
};

const provider = new ethers.JsonRpcProvider(
    `${defaultNetwork.url}/${INFURA_API_KEY}`
);

console.log('Provider:', provider);

function createNewWallet() {
    const wallet = ethers.Wallet.createRandom();
    const connectedWallet = wallet.connect(provider);

    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase,
        wallet: connectedWallet,
        network: defaultNetwork
    };
}

async function checkBNBBalance(address: string) {
    try {
        const balance = await provider.getBalance(address);
        const bnbBalance = ethers.formatEther(balance);
        console.log(`Balance ${defaultNetwork.nativeCurrency}: ${bnbBalance}`);
        return bnbBalance;
    } catch (error) {
        console.error('Error consultando balance BNB:', error);
    }
}

async function createPaymentOrderBSC(amountUSDT: number, description = 'Pago BSC') {
    console.log(`💳 Creando orden por ${amountUSDT} USDT en ${CURRENT_NETWORK.name}...`);

    const expectedAmount = ethers.parseUnits(amountUSDT.toString(), 18); // BSC USDT usa 18 decimales

    const order = {
        id: 'BSC_ORDER_' + Date.now(),
        amount: amountUSDT,
        expectedAmountWei: expectedAmount.toString(),
        description,
        paymentAddress: walletData.address,
        privateKey: walletData.privateKey,
        status: 'pending',
        createdAt: new Date().toISOString(),
        network: CURRENT_NETWORK.name,
        wallet: walletData.wallet
    };

    console.log('✅ Orden BSC creada:', {
        id: order.id,
        amount: `${order.amount} USDT`,
        address: order.paymentAddress,
        network: order.network
    });

    // Iniciar monitoreo
    await startBSCPaymentMonitoring(order);

    return order;
}

const newWallet = createNewWallet();
console.log('Wallet:', newWallet);
