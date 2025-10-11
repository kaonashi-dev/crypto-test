/**
 * Format balance amount based on size for better readability
 * @param balance - Balance as string
 * @param coin - Coin symbol
 * @param compact - Whether to use compact format (default: true)
 * @returns Formatted balance string
 */
export function formatBalance(balance: string, coin: string | null, compact = true): string {
  const numBalance = parseFloat(balance);
  
  if (!compact) {
    // Full precision for detailed views
    return `${numBalance.toFixed(8)} ${coin?.toUpperCase() || ''}`;
  }
  
  // Compact format based on amount size
  if (numBalance >= 1000000) {
    return `${(numBalance / 1000000).toFixed(2)}M ${coin?.toUpperCase() || ''}`;
  } else if (numBalance >= 1000) {
    return `${(numBalance / 1000).toFixed(2)}K ${coin?.toUpperCase() || ''}`;
  } else if (numBalance >= 1) {
    return `${numBalance.toFixed(4)} ${coin?.toUpperCase() || ''}`;
  } else if (numBalance >= 0.01) {
    return `${numBalance.toFixed(6)} ${coin?.toUpperCase() || ''}`;
  } else {
    return `${numBalance.toFixed(8)} ${coin?.toUpperCase() || ''}`;
  }
}

/**
 * Format address for display (truncate if too long)
 * @param address - Address string
 * @param maxLength - Maximum length before truncation (default: 16)
 * @returns Formatted address string
 */
export function formatAddress(address: string | null, maxLength = 16): string {
  if (!address) return 'N/A';
  if (address.length <= maxLength) return address;
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

/**
 * Format USD amount
 * @param amount - Amount as string or number
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted USD string
 */
export function formatUSD(amount: string | number, decimals = 2): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `$${numAmount.toFixed(decimals)}`;
}

/**
 * Validate address format for different networks
 * @param address - Address to validate
 * @param network - Network type (BTC, ETH, TRON, etc.)
 * @returns boolean indicating if address is valid
 */
export function validateAddress(address: string, network: string): boolean {
  if (!address || !network) return false;
  
  const trimmedAddress = address.trim();
  
  switch (network.toUpperCase()) {
    case 'BTC':
      // Bitcoin addresses: starts with 1, 3, or bc1
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmedAddress) || 
             /^bc1[a-z0-9]{39,59}$/.test(trimmedAddress);
    
    case 'ETH':
    case 'POLYGON':
    case 'BNB':
      // Ethereum-style addresses: 0x followed by 40 hex characters
      return /^0x[a-fA-F0-9]{40}$/.test(trimmedAddress);
    
    case 'TRON':
      // Tron addresses: starts with T
      return /^T[A-Za-z1-9]{33}$/.test(trimmedAddress);
    
    default:
      // Generic validation: at least 20 characters, alphanumeric
      return trimmedAddress.length >= 20 && /^[a-zA-Z0-9]+$/.test(trimmedAddress);
  }
}

/**
 * Clean and normalize address for API submission
 * @param address - Address to clean
 * @returns Cleaned address string
 */
export function cleanAddress(address: string): string {
  if (!address) return '';
  return address.trim();
}
