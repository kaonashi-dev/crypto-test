import { TronWeb } from 'tronweb';

interface Wallet {
  privateKey: string;
  publicKey: string;
  address: {
    base58: string;
    hex: string;
  };
}

// USDT TRC20 Contract Configuration
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT TRC20 on Tron mainnet
const USDT_CONTRACT_ADDRESS_TESTNET = 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf'; // USDT TRC20 on Tron testnet (Nile)

// USDT TRC20 ABI (compatible with TronWeb)
const USDT_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function",
    "stateMutability": "view"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_spender", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function",
    "stateMutability": "nonpayable"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function",
    "stateMutability": "view"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_from", "type": "address"},
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function",
    "stateMutability": "nonpayable"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function",
    "stateMutability": "view"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function",
    "stateMutability": "view"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function",
    "stateMutability": "view"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function",
    "stateMutability": "nonpayable"
  },
  {
    "constant": true,
    "inputs": [
      {"name": "_owner", "type": "address"},
      {"name": "_spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function",
    "stateMutability": "view"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "owner", "type": "address"},
      {"indexed": true, "name": "spender", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "from", "type": "address"},
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  }
];

const defaultWallet: Wallet = {
  privateKey: "",
  publicKey: "",
  address: {
    base58: "",
    hex: "",
  },
}

function createInstance(privateKey: string = '0') {
  const tronWeb = new TronWeb({
    fullHost: 'https://nile.trongrid.io',
    // headers: { 'TRON-PRO-API-KEY': Bun.env.TRON_PRO_API_KEY },
  });

  // Set private key if provided
  if (privateKey && privateKey !== '0') {
    tronWeb.setPrivateKey(privateKey);
  }

  return tronWeb;
}

// Función para obtener el balance de USDT
async function getUSDTBalance(wallet: Wallet, isTestnet: boolean = true) {
  try {
    const tronWeb = createInstance(wallet.privateKey);
    const contractAddress = isTestnet ? USDT_CONTRACT_ADDRESS_TESTNET : USDT_CONTRACT_ADDRESS;

    console.log('🔍 Debugging USDT balance check:');
    console.log('Network:', isTestnet ? 'Testnet (Nile)' : 'Mainnet');
    console.log('Contract address:', contractAddress);
    console.log('Wallet address:', wallet.address.base58);

    // Validar direcciones
    if (!tronWeb.isAddress(wallet.address.base58)) {
      throw new Error('Dirección de wallet inválida');
    }
    if (!tronWeb.isAddress(contractAddress)) {
      throw new Error('Dirección de contrato USDT inválida');
    }

    // Verificar si el contrato existe
    try {
      const contractInfo = await tronWeb.trx.getContract(contractAddress);
      console.log('✅ Contrato encontrado:', contractInfo);
    } catch (contractError) {
      console.log('❌ Error verificando contrato:', contractError);
      throw new Error(`El contrato USDT no existe en esta red. Dirección: ${contractAddress}`);
    }

    // Crear instancia del contrato USDT
    const contract = await tronWeb.contract(USDT_ABI, contractAddress);

    // Intentar diferentes métodos para obtener el balance
    let balance = 0;
    let decimals = 6; // Default para USDT

    try {
      // Método 1: triggerConstantContract
      console.log('🔍 Intentando obtener balance con triggerConstantContract...');
      const balanceResult = await tronWeb.transactionBuilder.triggerConstantContract(
        contractAddress,
        'balanceOf',
        {},
        [{ type: 'address', value: wallet.address.base58 }],
        wallet.address.base58
      );

      if (balanceResult.result && balanceResult.result.result) {
        balance = parseInt(balanceResult.result.result.toString(), 16);
        console.log('✅ Balance obtenido con triggerConstantContract:', balance);
      }
    } catch (error) {
      console.log('❌ Error con triggerConstantContract:', error instanceof Error ? error.message : 'Error desconocido');
    }

    // Si el primer método falló, intentar con el contrato directo
    if (balance === 0) {
      try {
        console.log('🔍 Intentando obtener balance con contrato directo...');
        const contract = await tronWeb.contract(USDT_ABI, contractAddress);
        const balanceResult = await contract.balanceOf(wallet.address.base58).call();
        balance = parseInt(balanceResult.toString());
        console.log('✅ Balance obtenido con contrato directo:', balance);
      } catch (error) {
        console.log('❌ Error con contrato directo:', error instanceof Error ? error.message : 'Error desconocido');
      }
    }

    // Usar decimales por defecto ya que la función decimals() no funciona en este contrato
    decimals = 6; // USDT típicamente usa 6 decimales
    console.log('✅ Usando decimales por defecto (6)');

    // Convertir balance a formato legible
    const balanceFormatted = balance / Math.pow(10, decimals);

    console.log('Balance USDT:', {
      address: wallet.address.base58,
      balance: balanceFormatted,
      balanceRaw: balance,
      decimals: decimals,
      network: isTestnet ? 'Testnet (Nile)' : 'Mainnet'
    });

    return {
      success: true,
      balance: balanceFormatted,
      balanceRaw: balance.toString(),
      decimals: decimals,
      address: wallet.address.base58
    };

  } catch (error) {
    console.error('Error obteniendo balance USDT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

async function createWallet() {
  const tronWeb = createInstance();
  const wallet = await tronWeb.createAccount();
  console.log('Wallet:', wallet);
  return wallet;
}

async function getBalance(wallet: Wallet) {
  const tronWeb = createInstance(wallet.privateKey);
  const balance = await tronWeb.trx.getBalance(wallet.address.base58);
  console.log('Balance:', balance);
  return balance;
}

async function singTransaction(wallet: Wallet) {
  const tronWeb = createInstance(wallet.privateKey);
  const transaction = await tronWeb.trx.signTransaction(wallet.address.base58, wallet.privateKey);
  console.log('Transaction:', transaction);
  return transaction;
}

async function createTransaction(wallet: Wallet, amount: number, to: string) {
  const tronWeb = createInstance(wallet.privateKey);
  const transaction = await tronWeb.transactionBuilder.sendTrx(to, amount,wallet.address.base58);
  console.log('Transaction:', transaction);
  return transaction;
}

// Función para transferir TRX
async function transferTRX(wallet: Wallet, toAddress: string, amountTRX: number) {
  try {
    const tronWeb = createInstance(wallet.privateKey);

    // Validar direcciones
    if (!tronWeb.isAddress(wallet.address.base58)) {
      throw new Error('Dirección de origen inválida');
    }
    if (!tronWeb.isAddress(toAddress)) {
      throw new Error('Dirección de destino inválida');
    }

    // Convertir TRX a SUN (1 TRX = 1,000,000 SUN)
    const amountSUN = amountTRX * 1000000;

    // Verificar balance suficiente
    const balance = await tronWeb.trx.getBalance(wallet.address.base58);
    if (balance < amountSUN) {
      throw new Error(`Balance insuficiente. Balance: ${balance / 1000000} TRX, Necesario: ${amountTRX} TRX`);
    }

    // Crear transacción
    const transaction = await tronWeb.transactionBuilder.sendTrx(
      toAddress,
      amountSUN,  // Monto en SUN
      wallet.address.base58  // Dirección de origen
    );

    // Firmar transacción
    const signedTransaction = await tronWeb.trx.sign(transaction, wallet.privateKey);

    // Enviar transacción
    const result = await tronWeb.trx.sendRawTransaction(signedTransaction);

    console.log('Transferencia TRX exitosa:', {
      txID: result.txid,
      from: wallet.address.base58,
      to: toAddress,
      amount: amountTRX,
      result: result.result
    });

    return {
      success: true,
      txID: result.txid,
      transaction: signedTransaction,
      result: result
    };

  } catch (error) {
    console.error('Error en transferencia TRX:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Función para transferir USDT (TRC20)
async function transferUSDT(wallet: Wallet, toAddress: string, amountUSDT: number, isTestnet: boolean = true) {
  try {
    const tronWeb = createInstance(wallet.privateKey);
    const contractAddress = isTestnet ? USDT_CONTRACT_ADDRESS_TESTNET : USDT_CONTRACT_ADDRESS;

    // Validar direcciones
    if (!tronWeb.isAddress(wallet.address.base58)) {
      throw new Error('Dirección de origen inválida');
    }
    if (!tronWeb.isAddress(toAddress)) {
      throw new Error('Dirección de destino inválida');
    }
    if (!tronWeb.isAddress(contractAddress)) {
      throw new Error('Dirección de contrato USDT inválida');
    }

    // Crear instancia del contrato USDT
    const contract = await tronWeb.contract(USDT_ABI, contractAddress);

    // USDT usa 6 decimales
    const decimals = 6;

    // Convertir cantidad a la unidad más pequeña (considerando decimales)
    const amountInSmallestUnit = Math.floor(amountUSDT * Math.pow(10, decimals));

    // Verificar balance de USDT
    let usdtBalance = 0;
    try {
      const balanceResult = await contract.balanceOf(wallet.address.base58).call();
      usdtBalance = parseInt(balanceResult.toString());
      console.log('✅ Balance verificado:', usdtBalance);
    } catch (error) {
      console.log('❌ Error verificando balance:', error instanceof Error ? error.message : 'Error desconocido');
      throw new Error('No se pudo verificar el balance USDT');
    }

    if (usdtBalance < amountInSmallestUnit) {
      const balanceFormatted = usdtBalance / Math.pow(10, decimals);
      throw new Error(`Balance USDT insuficiente. Balance: ${balanceFormatted} USDT, Necesario: ${amountUSDT} USDT`);
    }

    // Verificar balance de TRX para gas
    const trxBalance = await tronWeb.trx.getBalance(wallet.address.base58);
    const minTrxForGas = 15 * 1000000; // 15 TRX mínimo para gas (aumentado)
    if (trxBalance < minTrxForGas) {
      throw new Error(`Balance TRX insuficiente para gas. Balance: ${trxBalance / 1000000} TRX, Mínimo requerido: 15 TRX`);
    }

    console.log('🔍 Creando transacción de transferencia...');
    console.log('De:', wallet.address.base58);
    console.log('A:', toAddress);
    console.log('Cantidad:', amountInSmallestUnit);

     // MÉTODO 1: Usar el contrato directamente (RECOMENDADO)
     try {
       // Usar el método transfer del contrato directamente
       const txResult = await contract.transfer(
         toAddress,
         amountInSmallestUnit
       ).send({
         feeLimit: 100_000_000, // 100 TRX como límite de fee
         callValue: 0,
         shouldPollResponse: false // Cambiar a false para obtener el ID de transacción
       });

       // Si shouldPollResponse es false, txResult contiene la transacción
       const txID = txResult.txid || txResult.id || 'unknown';

       console.log('Transferencia USDT exitosa (Método 1):', {
         txID: txID,
         from: wallet.address.base58,
         to: toAddress,
         amount: amountUSDT,
         amountRaw: amountInSmallestUnit,
         decimals: decimals,
         network: isTestnet ? 'Testnet (Nile)' : 'Mainnet',
         fullResult: txResult
       });

       return {
         success: true,
         txID: txID,
         transaction: txResult,
         amount: amountUSDT,
         amountRaw: amountInSmallestUnit,
         decimals: decimals,
         network: isTestnet ? 'Testnet (Nile)' : 'Mainnet'
       };

    } catch (contractError) {
      console.log('Método 1 falló, intentando método 2...', contractError);

      // MÉTODO 2: Usar triggerSmartContract con formato correcto
      const functionSelector = 'transfer(address,uint256)';

      // Convertir dirección a formato hex sin 0x
      const addressHex = tronWeb.address.toHex(toAddress).replace('0x', '');
      // Convertir cantidad a hex de 64 caracteres
      const amountHex = amountInSmallestUnit.toString(16).padStart(64, '0');

      const parameter = addressHex + amountHex;

       const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
         contractAddress,
         functionSelector,
         {},
         [],
         wallet.address.base58
       );

      if (!transaction.result || !transaction.result.result) {
        throw new Error(`Error creando transacción: ${JSON.stringify(transaction)}`);
      }

      // Firmar transacción
      const signedTransaction = await tronWeb.trx.sign(transaction.transaction, wallet.privateKey);

      // Enviar transacción
      const result = await tronWeb.trx.sendRawTransaction(signedTransaction);

      if (!result.result) {
        throw new Error(`Error enviando transacción: ${JSON.stringify(result)}`);
      }

      console.log('Transferencia USDT exitosa (Método 2):', {
        txID: result.txid,
        from: wallet.address.base58,
        to: toAddress,
        amount: amountUSDT,
        amountRaw: amountInSmallestUnit,
        decimals: decimals,
        network: isTestnet ? 'Testnet (Nile)' : 'Mainnet',
        result: result.result
      });

      return {
        success: true,
        txID: result.txid,
        transaction: signedTransaction,
        result: result,
        amount: amountUSDT,
        amountRaw: amountInSmallestUnit,
        decimals: decimals,
        network: isTestnet ? 'Testnet (Nile)' : 'Mainnet'
      };
    }

  } catch (error) {
    console.error('Error en transferencia USDT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
async function getTransactionStatus(txID: string) {
  try {
    const tronWeb = createInstance();

    // Obtener información de la transacción
    const txInfo = await tronWeb.trx.getTransactionInfo(txID);
    const tx = await tronWeb.trx.getTransaction(txID);

    console.log('Transaction:', tx);

    return {
      txID: txID,
      confirmed: !!txInfo.blockNumber,
      blockNumber: txInfo.blockNumber,
      result: txInfo.result,
      fee: txInfo.fee,
      energyUsed: txInfo.receipt?.energy_usage_total || 0,
      netUsed: txInfo.receipt?.net_usage || 0,
      transaction: tx
    };

  } catch (error) {
    console.error('Error obteniendo estado de transacción:', error);
    return {
      txID: txID,
      confirmed: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Función para probar diferentes direcciones de contrato USDT en testnet
async function testUSDTContracts(wallet: Wallet) {
  const testContracts = [
    'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf', // Posible USDT testnet
    // 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs', // Anterior dirección
    // 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7', // Posible testnet alternativo
  ];

  console.log('🔍 Probando diferentes contratos USDT en testnet...');

  for (const contractAddress of testContracts) {
    try {
      console.log(`\n📋 Probando contrato: ${contractAddress}`);
      const tronWeb = createInstance(wallet.privateKey);

      // Verificar si el contrato existe
      const contractInfo = await tronWeb.trx.getContract(contractAddress);
      console.log('✅ Contrato existe:', contractInfo.contract_name || 'Sin nombre');

      // Probar diferentes funciones del contrato
      const functionsToTest = ['name', 'symbol', 'decimals', 'totalSupply', 'balanceOf'];

      for (const funcName of functionsToTest) {
        try {
          console.log(`  🔍 Probando función: ${funcName}`);

          let result;
          if (funcName === 'balanceOf') {
            result = await tronWeb.transactionBuilder.triggerConstantContract(
              contractAddress,
              funcName,
              {},
              [{ type: 'address', value: wallet.address.base58 }],
              wallet.address.base58
            );
          } else {
            result = await tronWeb.transactionBuilder.triggerConstantContract(
              contractAddress,
              funcName,
              {},
              [],
              wallet.address.base58
            );
          }

          if (result.result && result.result.result) {
            console.log(`  ✅ ${funcName}:`, result.result.result);
          } else {
            console.log(`  ❌ ${funcName}: No result`);
          }
        } catch (funcError) {
          console.log(`  ❌ ${funcName}:`, funcError instanceof Error ? funcError.message : 'Error desconocido');
        }
      }

      // Si llegamos aquí, el contrato parece funcional
      console.log('✅ Contrato parece funcional');
      return contractAddress;

    } catch (error) {
      console.log('❌ Error con este contrato:', error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  console.log('❌ Ningún contrato USDT funcionó en testnet');
  return null;
}

// Exportar funciones para uso en otros módulos
export {
  createWallet,
  getBalance,
  singTransaction,
  createTransaction,
  transferTRX,
  transferUSDT,
  getUSDTBalance,
  getTransactionStatus,
  testUSDTContracts,
  defaultWallet
};

export type { Wallet };

// Ejemplos de uso (comentados)
// await createWallet();
// await getBalance(defaultWallet);

// await getUSDTBalance(defaultWallet, true); // true para testnet
// await transferUSDT(defaultWallet, 'x', 3, true); // 10 USDT en testnet

// await transferTRX(defaultWallet, 'x', 5);

// await getTransactionStatus('x');
await getTransactionStatus('x');
