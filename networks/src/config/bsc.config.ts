import { BSCNetworkConfig } from '../types/network.types.ts';

export const BSC_NETWORKS: Record<string, BSCNetworkConfig> = {
  mainnet: {
    name: 'BSC Mainnet',
    url: 'https://bsc-mainnet.infura.io/v3/',
    rpcUrl: 'https://bsc-mainnet.infura.io/v3/',
    chainId: 56,
    usdt: '0x55d398326f99059fF775485246999027B3197955',
    usdtContract: '0x55d398326f99059fF775485246999027B3197955',
    nativeCurrency: 'BNB',
    explorerUrl: 'https://bscscan.com',
  },
  testnet: {
    name: 'BSC Testnet',
    url: 'https://bsc-testnet.infura.io/v3/',
    rpcUrl: 'https://bsc-testnet.infura.io/v3/',
    chainId: 97,
    usdt: '0xB4963Dabb71092Bf5d8DbbE914b15db3A9758241',
    usdtContract: '0xB4963Dabb71092Bf5d8DbbE914b15db3A9758241',
    nativeCurrency: 'tBNB',
    explorerUrl: 'https://testnet.bscscan.com',
  },
};

export const BUSD_TESTNET = {
  address: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
  name: 'BUSD Token',
  symbol: 'BUSD',
  decimals: 18,
  verified: true,
  faucet: 'https://testnet.binance.org/faucet-smart',
};

export const BSC_USDT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];
