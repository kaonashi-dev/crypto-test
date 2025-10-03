import { NetworkConfig } from '../types/network.types.ts';

export const USDT_CONTRACT_ADDRESS_MAINNET = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
export const USDT_CONTRACT_ADDRESS_TESTNET = '0x509Ee0d083DdF8AC028f2a56731412edD63223B9';

export const ETHEREUM_NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Ethereum Mainnet',
    rpcUrl: Bun.env.INFURA_URL || '',
    chainId: 1,
    usdtContract: USDT_CONTRACT_ADDRESS_MAINNET,
  },
  tenderly: {
    name: 'Tenderly Testnet',
    rpcUrl: Bun.env.TENDERLY_URL || '',
    chainId: 1,
    usdtContract: USDT_CONTRACT_ADDRESS_MAINNET,
  },
  alchemy: {
    name: 'Alchemy Testnet',
    rpcUrl: Bun.env.ALCHEMY_URL || '',
    chainId: 1,
    usdtContract: USDT_CONTRACT_ADDRESS_MAINNET,
  },
  public: {
    name: 'Public Ethereum RPC',
    rpcUrl: 'https://ethereum.publicnode.com',
    chainId: 1,
    usdtContract: USDT_CONTRACT_ADDRESS_MAINNET,
  },
};

export const USDT_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'spender', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
];
