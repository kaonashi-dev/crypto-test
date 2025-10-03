// Export services
export { EthereumService } from './services/ethereum.service.ts';
export { TronService } from './services/tron.service.ts';
export { BSCPaymentService } from './services/bsc.service.ts';

// Export types
export type {
  BaseWallet,
  EthereumWallet,
  TronWallet,
  WalletBalance,
  TransactionResult,
  TransactionStatus,
} from './types/wallet.types.ts';

export type {
  NetworkConfig,
  BSCNetworkConfig,
  NetworkType,
} from './types/network.types.ts';

// Export configs
export { ETHEREUM_NETWORKS, USDT_ABI } from './config/ethereum.config.ts';
export { BSC_NETWORKS, BSC_USDT_ABI, BUSD_TESTNET } from './config/bsc.config.ts';
export { TRON_CONFIG, TRON_USDT_ABI } from './config/tron.config.ts';

// Export utils
export {
  validateEthereumAddress,
  validateAmount,
  validatePrivateKey,
  validateRpcUrl,
  ValidationError,
} from './utils/validation.utils.ts';

export {
  NetworkError,
  InsufficientBalanceError,
  TransactionError,
  handleError,
} from './utils/error.utils.ts';

export { Logger } from './utils/logger.utils.ts';
