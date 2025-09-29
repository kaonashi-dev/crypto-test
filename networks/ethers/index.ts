import { ethers } from 'ethers';

interface Wallet {
    privateKey: string;
    publicKey?: string;
    address: string;
}

// USDT ERC20 Contract Configuration
const USDT_CONTRACT_ADDRESS_MAINNET = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT ERC20 on Ethereum mainnet
const USDT_CONTRACT_ADDRESS_TESTNET = '0x509Ee0d083DdF8AC028f2a56731412edD63223B9'; // USDT ERC20 on Goerli testnet

// USDT ERC20 ABI (compatible with ethers)
const USDT_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{ "name": "", "type": "string" }],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "name": "_spender", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{ "name": "", "type": "uint256" }],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "name": "_from", "type": "address" },
            { "name": "_to", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "transferFrom",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{ "name": "", "type": "string" }],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "name": "_to", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            { "name": "_owner", "type": "address" },
            { "name": "_spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "owner", "type": "address" },
            { "indexed": true, "name": "spender", "type": "address" },
            { "indexed": false, "name": "value", "type": "uint256" }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "from", "type": "address" },
            { "indexed": true, "name": "to", "type": "address" },
            { "indexed": false, "name": "value", "type": "uint256" }
        ],
        "name": "Transfer",
        "type": "event"
    }
];

const defaultWallet: Wallet = {
    privateKey: "",
    publicKey: "",
    address: "",
};

// Network configurations
const NETWORKS = {
    mainnet: {
        name: 'Ethereum Mainnet',
        rpcUrl: Bun.env.INFURA_URL,
        chainId: 1,
        usdtContract: USDT_CONTRACT_ADDRESS_MAINNET
    },
    tenderly: {
        name: 'Tenderly Testnet',
        rpcUrl: Bun.env.TENDERLY_URL,
        chainId: 1,
        usdtContract: USDT_CONTRACT_ADDRESS_MAINNET
    },
    alchemy: {
        name: 'Alchemy Testnet',
        rpcUrl: Bun.env.ALCHEMY_URL,
        chainId: 1,
        usdtContract: USDT_CONTRACT_ADDRESS_MAINNET
    },
    public: {
        name: 'Public Ethereum RPC',
        rpcUrl: 'https://ethereum.publicnode.com',
        chainId: 1,
        usdtContract: USDT_CONTRACT_ADDRESS_MAINNET
    }
};

function createProvider(network: keyof typeof NETWORKS = 'public') {
    const networkConfig = NETWORKS[network];

    // Validate RPC URL
    if (!networkConfig.rpcUrl || networkConfig.rpcUrl.includes('YOUR_')) {
        throw new Error(`RPC URL not configured for network: ${network}. Please set the appropriate environment variable or update the URL.`);
    }

    console.log(`🔗 Connecting to ${networkConfig.name}: ${networkConfig.rpcUrl}`);
    return new ethers.JsonRpcProvider(networkConfig.rpcUrl);
}

function createWallet(privateKey?: string): Wallet {
    let wallet: ethers.Wallet;

    if (privateKey && privateKey !== '0') {
        wallet = new ethers.Wallet(privateKey);
    } else {
        wallet = ethers.Wallet.createRandom() as unknown as ethers.Wallet;
    }

    // Extract the public key manually to avoid type issues
    const publicKey = (wallet as any).publicKey || undefined;

    return {
        privateKey: wallet.privateKey,
        publicKey: publicKey,
        address: wallet.address
    };
}

// Función para obtener el balance de ETH
async function getETHBalance(wallet: Wallet, network: keyof typeof NETWORKS = 'public') {
    try {
        const provider = createProvider(network);
        const balance = await provider.getBalance(wallet.address);
        console.log('Balance:', balance);
        const balanceInETH = ethers.formatEther(balance);

        console.log('Balance ETH:', {
            address: wallet.address,
            balance: balanceInETH,
            balanceWei: balance.toString(),
            network: NETWORKS[network].name
        });

        return {
            success: true,
            balance: balanceInETH,
            balanceWei: balance.toString(),
            address: wallet.address,
            network: NETWORKS[network].name
        };

    } catch (error) {
        console.error('Error obteniendo balance ETH:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

// Función para obtener el balance de USDT
async function getUSDTBalance(wallet: Wallet, network: keyof typeof NETWORKS = 'public') {
    try {
        const provider = createProvider(network);
        const networkConfig = NETWORKS[network];
        const contractAddress = networkConfig.usdtContract;

        console.log('🔍 Debugging USDT balance check:');
        console.log('Network:', networkConfig.name);
        console.log('Contract address:', contractAddress);
        console.log('Wallet address:', wallet.address);

        // Validar direcciones
        if (!ethers.isAddress(wallet.address)) {
            throw new Error('Dirección de wallet inválida');
        }
        if (!ethers.isAddress(contractAddress)) {
            throw new Error('Dirección de contrato USDT inválida');
        }

        // Crear instancia del contrato USDT
        const contract = new ethers.Contract(contractAddress, USDT_ABI, provider);

        // Obtener balance y decimales
        const balance = await (contract.balanceOf as any)(wallet.address) as bigint;
        const decimals = await (contract.decimals as any)() as number;

        // Convertir balance a formato legible
        const balanceFormatted = ethers.formatUnits(balance, decimals);

        console.log('Balance USDT:', {
            address: wallet.address,
            balance: balanceFormatted,
            balanceRaw: balance.toString(),
            decimals: decimals,
            network: networkConfig.name
        });

        return {
            success: true,
            balance: balanceFormatted,
            balanceRaw: balance.toString(),
            decimals: decimals,
            address: wallet.address,
            network: networkConfig.name
        };

    } catch (error) {
        console.error('Error obteniendo balance USDT:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

// Función para transferir ETH
async function transferETH(wallet: Wallet, toAddress: string, amountETH: number, network: keyof typeof NETWORKS = 'public') {
    try {
        const provider = createProvider(network);
        const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

        // Validar direcciones
        if (!ethers.isAddress(wallet.address)) {
            throw new Error('Dirección de origen inválida');
        }
        if (!ethers.isAddress(toAddress)) {
            throw new Error('Dirección de destino inválida');
        }

        // Convertir ETH a Wei
        const amountWei = ethers.parseEther(amountETH.toString());

        // Verificar balance suficiente
        const balance = await provider.getBalance(wallet.address);
        if (balance < amountWei) {
            const balanceETH = ethers.formatEther(balance);
            throw new Error(`Balance insuficiente. Balance: ${balanceETH} ETH, Necesario: ${amountETH} ETH`);
        }

        // Crear transacción
        const transaction = {
            to: toAddress,
            value: amountWei,
            gasLimit: 21000, // Gas limit estándar para transferencias ETH
        };

        // Estimar gas price
        const feeData = await provider.getFeeData();
        if (feeData.gasPrice) {
            (transaction as any).gasPrice = feeData.gasPrice;
        }

        // Firmar y enviar transacción
        const txResponse = await walletInstance.sendTransaction(transaction);
        console.log('Transacción enviada:', txResponse.hash);

        // Esperar confirmación
        const receipt = await txResponse.wait();

        console.log('Transferencia ETH exitosa:', {
            txHash: receipt?.hash,
            from: wallet.address,
            to: toAddress,
            amount: amountETH,
            gasUsed: receipt?.gasUsed.toString(),
            network: NETWORKS[network].name
        });

        return {
            success: true,
            txHash: receipt?.hash,
            transaction: txResponse,
            receipt: receipt,
            amount: amountETH,
            network: NETWORKS[network].name
        };

    } catch (error) {
        console.error('Error en transferencia ETH:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

// Función para transferir USDT (ERC20)
async function transferUSDT(wallet: Wallet, toAddress: string, amountUSDT: number, network: keyof typeof NETWORKS = 'public') {
    try {
        const provider = createProvider(network);
        const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
        const networkConfig = NETWORKS[network];
        const contractAddress = networkConfig.usdtContract;

        // Validar direcciones
        if (!ethers.isAddress(wallet.address)) {
            throw new Error('Dirección de origen inválida');
        }
        if (!ethers.isAddress(toAddress)) {
            throw new Error('Dirección de destino inválida');
        }
        if (!ethers.isAddress(contractAddress)) {
            throw new Error('Dirección de contrato USDT inválida');
        }

        // Crear instancia del contrato USDT
        const contract = new ethers.Contract(contractAddress, USDT_ABI, walletInstance);

        // Obtener decimales del contrato
        const decimals = await (contract.decimals as any)() as number;

        // Convertir cantidad a la unidad más pequeña
        const amountInSmallestUnit = ethers.parseUnits(amountUSDT.toString(), decimals);

        // Verificar balance de USDT
        const usdtBalance = await (contract.balanceOf as any)(wallet.address) as bigint;
        if (usdtBalance < amountInSmallestUnit) {
            const balanceFormatted = ethers.formatUnits(usdtBalance, decimals);
            throw new Error(`Balance USDT insuficiente. Balance: ${balanceFormatted} USDT, Necesario: ${amountUSDT} USDT`);
        }

        // Verificar balance de ETH para gas
        const ethBalance = await provider.getBalance(wallet.address);
        const minEthForGas = ethers.parseEther('0.01'); // 0.01 ETH mínimo para gas
        if (ethBalance < minEthForGas) {
            const balanceETH = ethers.formatEther(ethBalance);
            throw new Error(`Balance ETH insuficiente para gas. Balance: ${balanceETH} ETH, Mínimo requerido: 0.01 ETH`);
        }

        console.log('🔍 Creando transacción de transferencia USDT...');
        console.log('De:', wallet.address);
        console.log('A:', toAddress);
        console.log('Cantidad:', amountInSmallestUnit.toString());

        // Crear transacción de transferencia
        const txResponse = await (contract.transfer as any)(toAddress, amountInSmallestUnit) as ethers.ContractTransactionResponse;
        console.log('Transacción enviada:', txResponse.hash);

        // Esperar confirmación
        const receipt = await txResponse.wait();

        console.log('Transferencia USDT exitosa:', {
            txHash: receipt?.hash,
            from: wallet.address,
            to: toAddress,
            amount: amountUSDT,
            amountRaw: amountInSmallestUnit.toString(),
            decimals: decimals,
            gasUsed: receipt?.gasUsed.toString(),
            network: networkConfig.name
        });

        return {
            success: true,
            txHash: receipt?.hash,
            transaction: txResponse,
            receipt: receipt,
            amount: amountUSDT,
            amountRaw: amountInSmallestUnit.toString(),
            decimals: decimals,
            network: networkConfig.name
        };

    } catch (error) {
        console.error('Error en transferencia USDT:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

// Función para obtener el estado de una transacción
async function getTransactionStatus(txHash: string, network: keyof typeof NETWORKS = 'public') {
    try {
        const provider = createProvider(network);

        // Obtener información de la transacción
        const [tx, receipt] = await Promise.all([
            provider.getTransaction(txHash),
            provider.getTransactionReceipt(txHash)
        ]);

        if (!tx) {
            throw new Error('Transacción no encontrada');
        }

        console.log('Transaction Status:', {
            txHash: txHash,
            confirmed: !!receipt,
            blockNumber: receipt?.blockNumber,
            gasUsed: receipt?.gasUsed.toString(),
            status: receipt?.status,
            network: NETWORKS[network].name
        });

        return {
            txHash: txHash,
            confirmed: !!receipt,
            blockNumber: receipt?.blockNumber,
            gasUsed: receipt?.gasUsed?.toString(),
            status: receipt?.status,
            transaction: tx,
            receipt: receipt,
            network: NETWORKS[network].name
        };

    } catch (error) {
        console.error('Error obteniendo estado de transacción:', error);
        return {
            txHash: txHash,
            confirmed: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            network: NETWORKS[network].name
        };
    }
}

// Función para obtener información de la red
async function getNetworkInfo(network: keyof typeof NETWORKS = 'public') {
    try {
        const provider = createProvider(network);
        const networkConfig = NETWORKS[network];

        const [blockNumber, feeData, chainId] = await Promise.all([
            provider.getBlockNumber(),
            provider.getFeeData(),
            provider.getNetwork()
        ]);

        return {
            name: networkConfig.name,
            chainId: chainId.chainId,
            blockNumber: blockNumber,
            gasPrice: feeData.gasPrice?.toString() || '0',
            rpcUrl: networkConfig.rpcUrl,
            usdtContract: networkConfig.usdtContract
        };

    } catch (error) {
        console.error('Error obteniendo información de red:', error);
        return {
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

// Función para estimar gas de una transacción
async function estimateGas(wallet: Wallet, toAddress: string, amountETH: number, network: keyof typeof NETWORKS = 'public') {
    try {
        const provider = createProvider(network);
        const amountWei = ethers.parseEther(amountETH.toString());

        const gasEstimate = await provider.estimateGas({
            from: wallet.address,
            to: toAddress,
            value: amountWei
        });

        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
        const totalCost = gasEstimate * gasPrice;

        return {
            gasEstimate: gasEstimate.toString(),
            gasPrice: gasPrice.toString(),
            totalCost: ethers.formatEther(totalCost),
            totalCostWei: totalCost.toString()
        };

    } catch (error) {
        console.error('Error estimando gas:', error);
        return {
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

// Exportar funciones para uso en otros módulos
export {
    createWallet,
    getETHBalance,
    getUSDTBalance,
    transferETH,
    transferUSDT,
    getTransactionStatus,
    getNetworkInfo,
    estimateGas,
    defaultWallet,
    NETWORKS
};

export type { Wallet };

// const wallet = createWallet();
// console.log('Wallet:', wallet);

await getETHBalance(defaultWallet, 'tenderly');
await getUSDTBalance(defaultWallet, 'tenderly');

// await transferETH(defaultWallet, '', 3, 'tenderly');
// await transferUSDT(defaultWallet, '', 5, 'tenderly');

// await getTransactionStatus('', 'tenderly');
// await getTransactionStatus('', 'tenderly');
