import { TronWeb } from 'tronweb';

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { 'TRON-PRO-API-KEY': Bun.env.TRON_PRO_API_KEY },
    privateKey: Bun.env.TRON_PRIVATE_KEY
  });