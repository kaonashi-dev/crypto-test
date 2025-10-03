export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  usdtContract: string;
  explorerUrl?: string;
  nativeCurrency?: string;
}

export interface BSCNetworkConfig extends NetworkConfig {
  url: string;
}

export type NetworkType = 'mainnet' | 'testnet' | 'tenderly' | 'alchemy' | 'public';
