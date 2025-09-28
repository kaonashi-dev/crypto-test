import { ethers } from 'ethers';

// ============================================
// CONFIGURACIÓN CORREGIDA
// ============================================

const INFURA_API_KEY = Bun.env.INFURA_API_KEY;

const CONTRACTS = {
    mainnet: {
        url: `https://bsc-mainnet.infura.io/v3/`,
        chainId: 56,
        name: 'BSC Mainnet',
        // ✅ Direcciones con checksum correcto
        usdt: '0x55d398326f99059fF775485246999027B3197955', // Ya está correcta
        nativeCurrency: 'BNB',
        explorerUrl: 'https://bscscan.com'
    },
    testnet: {
        url: `https://bsc-testnet.infura.io/v3/`,
        chainId: 97,
        name: 'BSC Testnet', 
        // ✅ CORRECCIÓN: Checksum correcto para USDT testnet
        usdt: '0xB4963Dabb71092Bf5d8DbbE914b15db3A9758241', // Formato correcto
        nativeCurrency: 'tBNB',
        explorerUrl: 'https://testnet.bscscan.com'
    },
    busd_testnet: {
        address: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
        name: 'BUSD Token',
        symbol: 'BUSD', 
        decimals: 18,
        verified: true,
        faucet: 'https://testnet.binance.org/faucet-smart'
    },
};

const USDT_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// ✅ Función helper para validar direcciones
function validateAddress(address: string) {
    console.log('🔍 Validando dirección:', address);
    // return address;
    try {
        return ethers.getAddress(address); // Esto convierte a checksum correcto
    } catch (error) {
        console.error(`❌ Dirección inválida: ${address}`, error.message);
        throw new Error(`Invalid address format: ${address}`);
    }
}

class BSCPaymentSystem {
    constructor(network = 'testnet') {
        this.network = CONTRACTS[network];
        this.provider = new ethers.JsonRpcProvider(`${this.network.url}${INFURA_API_KEY}`);
        this.orders = new Map();
        // this.usdtAddress = validateAddress(this.network.usdt);
    }

    // ============================================
    // 1. CREAR WALLET
    // ============================================
    
    createWallet() {
        try {
            const wallet = ethers.Wallet.createRandom();
            const connectedWallet = wallet.connect(this.provider);
            
            const walletData = {
                address: wallet.address, // Ya viene con checksum correcto
                privateKey: wallet.privateKey,
                mnemonic: wallet.mnemonic.phrase,
                wallet: connectedWallet,
                network: this.network.name,
                createdAt: new Date().toISOString()
            };
            
            console.log('✅ Wallet creada:', {
                address: walletData.address,
                network: walletData.network
            });
            
            return walletData;
        } catch (error) {
            console.error('❌ Error creando wallet:', error);
            throw error;
        }
    }

    importWallet(privateKey) {
        try {
            const wallet = new ethers.Wallet(privateKey);
            const connectedWallet = wallet.connect(this.provider);
            
            const walletData = {
                address: wallet.address, // Ya viene con checksum correcto
                privateKey: wallet.privateKey,
                mnemonic: wallet.mnemonic?.phrase || null,
                wallet: connectedWallet,
                network: this.network.name,
                imported: true
            };
            
            console.log('✅ Wallet importada:', {
                address: walletData.address,
                network: walletData.network
            });
            
            return walletData;
        } catch (error) {
            console.error('❌ Error importando wallet:', error);
            throw error;
        }
    }

    // ============================================
    // 2. CONSULTA DE SALDO
    // ============================================
    
    async checkBalance(address, token = 'both') {
        try {
            // ✅ Validar dirección de entrada
            const validAddress = validateAddress(address);
            const balances = {};
            
            // Balance de BNB (moneda nativa)
            if (token === 'both' || token === 'bnb') {
                const bnbBalance = await this.provider.getBalance(validAddress);
                balances.bnb = {
                    raw: bnbBalance.toString(),
                    formatted: ethers.formatEther(bnbBalance),
                    symbol: this.network.nativeCurrency
                };
            }
            
            // Balance de USDT
            if (token === 'both' || token === 'usdt') {
                const usdtContract = new ethers.Contract(
                    this.usdtAddress, // ✅ Usar dirección validada
                    USDT_ABI, 
                    this.provider
                );
                
                const usdtBalance = await usdtContract.balanceOf(validAddress);
                const decimals = await usdtContract.decimals();
                
                balances.usdt = {
                    raw: usdtBalance.toString(),
                    formatted: ethers.formatUnits(usdtBalance, decimals),
                    symbol: 'USDT',
                    decimals: decimals.toString()
                };
            }
            
            console.log(`💰 Balances para ${validAddress}:`);
            if (balances.bnb) {
                console.log(`   ${balances.bnb.symbol}: ${balances.bnb.formatted}`);
            }
            if (balances.usdt) {
                console.log(`   USDT: ${balances.usdt.formatted}`);
            }
            
            return balances;
        } catch (error) {
            console.error('❌ Error consultando balances:', error);
            throw error;
        }
    }

    // ============================================
    // 3. CREAR TRANSACCIÓN (ORDEN DE PAGO)
    // ============================================
    
    async createTransaction(amountUSDT, walletData, description = 'Payment test', expirationMinutes = 5) {
        try {
            console.log(`💳 Creando transacción por ${amountUSDT} USDT...`);
            
            // ✅ Validar dirección de la wallet
            const validPaymentAddress = validateAddress(this.network.usdt);
            
            // Crear contrato USDT con dirección validada
            console.log('🔍 Validando dirección USDT:', walletData.address);
            const usdtContract = new ethers.Contract(
                validPaymentAddress, 
                USDT_ABI, 
                this.provider
            );
            
            const decimals = await usdtContract.decimals();
            const expectedAmount = ethers.parseUnits(amountUSDT.toString(), decimals);
            
            const transaction = {
                id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                amount: amountUSDT,
                expectedAmountWei: expectedAmount.toString(),
                decimals: decimals.toString(),
                description,
                paymentAddress: validPaymentAddress, // ✅ Dirección validada
                privateKey: walletData.privateKey,
                status: 'pending',
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString(),
                network: this.network.name,
                explorerUrl: `${this.network.explorerUrl}/address/${validPaymentAddress}`,
                transactionHash: null
            };
            
            // Guardar orden
            this.orders.set(transaction.id, transaction);
            
            console.log('✅ Transacción creada:', {
                id: transaction.id,
                amount: `${transaction.amount} USDT`,
                address: transaction.paymentAddress,
                network: transaction.network,
                expires: new Date(transaction.expiresAt).toLocaleString()
            });
            
            // Iniciar monitoreo automático
            this.startMonitoring(transaction.id);
            
            return transaction;
        } catch (error) {
            console.error('❌ Error creando transacción:', error);
            throw error;
        }
    }

    // ============================================
    // 4. CONSULTA DE ESTADO
    // ============================================
    
    async getTransactionStatus(transactionId, walletData) {
        try {
            const transaction = this.orders.get(transactionId);
            
            if (!transaction) {
                return {
                    error: 'Transacción no encontrada',
                    id: transactionId
                };
            }
            
            // Verificar si expiró
            if (new Date() > new Date(transaction.expiresAt) && transaction.status === 'pending') {
                transaction.status = 'expired';
                transaction.expiredAt = new Date().toISOString();
                this.orders.set(transactionId, transaction); // ✅ Actualizar en el Map
            }
            
            // Consultar balance actual si está pendiente
            if (transaction.status === 'pending') {
                try {
                    const balances = await this.checkBalance(transaction.paymentAddress, 'usdt');
                    const currentBalance = parseFloat(balances.usdt.formatted);
                    
                    // Verificar si se completó el pago
                    if (currentBalance >= transaction.amount) {
                        transaction.status = 'completed';
                        transaction.completedAt = new Date().toISOString();
                        transaction.receivedAmount = currentBalance;
                        
                        this.orders.set(transactionId, transaction); // ✅ Actualizar en el Map
                        console.log(`✅ Transacción ${transactionId} completada por consulta manual!`);
                    }
                } catch (balanceError) {
                    console.warn('⚠️ Error consultando balance para verificación:', balanceError.message);
                }
            }
            
            const status = {
                id: transaction.id,
                status: transaction.status,
                amount: transaction.amount,
                description: transaction.description,
                paymentAddress: transaction.paymentAddress,
                network: transaction.network,
                createdAt: transaction.createdAt,
                expiresAt: transaction.expiresAt,
                transactionHash: transaction.transactionHash,
                explorerUrl: transaction.explorerUrl
            };
            
            if (transaction.completedAt) status.completedAt = transaction.completedAt;
            if (transaction.expiredAt) status.expiredAt = transaction.expiredAt;
            if (transaction.receivedAmount) status.receivedAmount = transaction.receivedAmount;
            
            console.log(`📊 Estado de transacción ${transactionId}:`, {
                status: status.status,
                amount: `${status.amount} USDT`,
                address: status.paymentAddress
            });
            
            return status;
        } catch (error) {
            console.error('❌ Error consultando estado:', error);
            throw error;
        }
    }

    // ============================================
    // MONITOREO AUTOMÁTICO
    // ============================================
    
    async startMonitoring(transactionId) {
        const transaction = this.orders.get(transactionId);
        if (!transaction) return;
        
        console.log(`🔍 Iniciando monitoreo para transacción: ${transactionId}`);
        
        try {
            const usdtContract = new ethers.Contract(
                this.usdtAddress, // ✅ Usar dirección validada
                USDT_ABI, 
                this.provider
            );
            
            // ✅ Filtro con dirección validada
            const filter = {
                address: this.usdtAddress,
                topics: [
                    ethers.id("Transfer(address,address,uint256)"),
                    null,
                    ethers.zeroPadValue(transaction.paymentAddress, 32)
                ]
            };
            
            // Listener de eventos
            const eventListener = async (log) => {
                try {
                    const parsedLog = usdtContract.interface.parseLog(log);
                    if (!parsedLog) return;
                    
                    const receivedAmount = parsedLog.args.value;
                    const decimals = await usdtContract.decimals();
                    const formattedAmount = ethers.formatUnits(receivedAmount, decimals);
                    
                    console.log(`💰 Pago recibido en ${transactionId}: ${formattedAmount} USDT`);
                    console.log(`📍 TX Hash: ${log.transactionHash}`);
                    
                    if (receivedAmount >= BigInt(transaction.expectedAmountWei)) {
                        transaction.status = 'completed';
                        transaction.transactionHash = log.transactionHash;
                        transaction.completedAt = new Date().toISOString();
                        transaction.receivedAmount = formattedAmount;
                        
                        this.orders.set(transactionId, transaction); // ✅ Actualizar
                        
                        console.log(`✅ Transacción ${transactionId} COMPLETADA!`);
                        console.log(`🔗 Ver en explorer: ${this.network.explorerUrl}/tx/${log.transactionHash}`);
                        
                        // Detener monitoreo
                        this.provider.off(filter, eventListener);
                    }
                } catch (error) {
                    console.error('Error procesando evento:', error);
                }
            };
            
            this.provider.on(filter, eventListener);
            
            // Backup polling cada 30 segundos
            const pollingInterval = setInterval(async () => {
                try {
                    const currentTransaction = this.orders.get(transactionId);
                    if (!currentTransaction || currentTransaction.status !== 'pending') {
                        clearInterval(pollingInterval);
                        return;
                    }
                    
                    // Verificar expiración
                    if (new Date() > new Date(currentTransaction.expiresAt)) {
                        currentTransaction.status = 'expired';
                        currentTransaction.expiredAt = new Date().toISOString();
                        this.orders.set(transactionId, currentTransaction);
                        console.log(`⏰ Transacción ${transactionId} expirada`);
                        clearInterval(pollingInterval);
                        this.provider.off(filter, eventListener);
                        return;
                    }
                    
                    // Verificar balance
                    try {
                        const balance = await usdtContract.balanceOf(currentTransaction.paymentAddress);
                        const decimals = await usdtContract.decimals();
                        const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
                        
                        if (balanceFormatted >= currentTransaction.amount) {
                            currentTransaction.status = 'completed';
                            currentTransaction.completedAt = new Date().toISOString();
                            currentTransaction.receivedAmount = balanceFormatted;
                            
                            this.orders.set(transactionId, currentTransaction);
                            console.log(`✅ Transacción ${transactionId} completada por polling!`);
                            clearInterval(pollingInterval);
                            this.provider.off(filter, eventListener);
                        }
                    } catch (pollError) {
                        console.warn('⚠️ Error en polling balance:', pollError.message);
                    }
                } catch (error) {
                    console.error('Error en polling:', error);
                }
            }, 30000);
            
        } catch (error) {
            console.error('❌ Error iniciando monitoreo:', error);
        }
    }

    // ============================================
    // UTILIDADES ADICIONALES
    // ============================================
    
    getAllTransactions() {
        const transactions = Array.from(this.orders.values());
        console.log(`📋 Total de transacciones: ${transactions.length}`);
        return transactions;
    }
    
    async testConnection() {
        try {
            console.log(`🔗 Probando conexión con ${this.network.name}...`);
            
            const blockNumber = await this.provider.getBlockNumber();
            const network = await this.provider.getNetwork();
            
            // ✅ Test del contrato USDT con dirección validada
            console.log(`📄 Verificando contrato USDT: ${this.usdtAddress}`);
            const usdtContract = new ethers.Contract(
                this.usdtAddress,
                USDT_ABI,
                this.provider
            );
            
            try {
                const name = await usdtContract.name();
                const symbol = await usdtContract.symbol();
                const decimals = await usdtContract.decimals();
                
                console.log('✅ Contrato USDT verificado:', {
                    name,
                    symbol,
                    decimals: decimals.toString(),
                    address: this.usdtAddress
                });
            } catch (contractError) {
                console.warn('⚠️ Error verificando contrato USDT:', contractError.message);
            }
            
            console.log('✅ Conexión exitosa:', {
                network: this.network.name,
                chainId: network.chainId.toString(),
                latestBlock: blockNumber
            });
            
            return true;
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            return false;
        }
    }
}

// ============================================
// EJEMPLO CORREGIDO
// ============================================

async function ejemploCompleto() {
    const paymentSystem = new BSCPaymentSystem('testnet');
    
    try {
        console.log('\n=== TEST DE CONEXIÓN ===');
        const connected = await paymentSystem.testConnection();
        if (!connected) {
            console.error('❌ No se pudo conectar');
            return;
        }
        
        console.log('\n=== CREAR WALLET ===');
        const wallet = paymentSystem.createWallet();
        
        console.log('\n=== CONSULTAR BALANCES ===');
        await paymentSystem.checkBalance(wallet.address);
        
        console.log('\n=== CREAR TRANSACCIÓN ===');
        const transaction = await paymentSystem.createTransaction(1, wallet, 'Pago de prueba', 60);
        
        console.log('\n=== CONSULTAR ESTADO ===');
        const status = await paymentSystem.getTransactionStatus(transaction.id);
        
        console.log('\n🎉 Sistema listo! Datos importantes:');
        console.log(`📄 ID Transacción: ${transaction.id}`);
        console.log(`💰 Monto: ${transaction.amount} USDT`);
        console.log(`📍 Dirección de pago: ${transaction.paymentAddress}`);
        console.log(`🔗 Explorer: ${transaction.explorerUrl}`);
        
        return { paymentSystem, wallet, transaction };
        
    } catch (error) {
        console.error('❌ Error en ejemplo:', error);
    }
}

export {
    BSCPaymentSystem,
    CONTRACTS,
    ejemploCompleto,
    validateAddress
};