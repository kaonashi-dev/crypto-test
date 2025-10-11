import { nanoid, customAlphabet } from 'nanoid';

// Custom alphabet without underscores and hyphens
const CUSTOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Create custom nanoid function
const customNanoid = customAlphabet(CUSTOM_ALPHABET, 21);

export class IdGenerator {
  /**
   * Generate a merchant ID (21 characters, no underscores or hyphens)
   */
  static generateMerchantId(): string {
    return customNanoid();
  }

  /**
   * Generate a wallet address for different networks
   */
  static generateWalletAddress(network: 'bitcoin' | 'ethereum' | 'polygon'): string {
    const prefixes = {
      bitcoin: '1',
      ethereum: '0x',
      polygon: '0x'
    };

    const prefix = prefixes[network];
    const randomHex = customNanoid().toLowerCase();
    
    if (network === 'bitcoin') {
      return prefix + randomHex.substring(0, 33);
    }
    
    return prefix + randomHex.substring(0, 40);
  }

  /**
   * Generate a transaction hash
   */
  static generateTransactionHash(): string {
    return '0x' + customNanoid().toLowerCase() + customNanoid().toLowerCase();
  }

  /**
   * Generate a generic ID with custom length
   */
  static generateId(length: number = 21): string {
    return customAlphabet(CUSTOM_ALPHABET, length)();
  }

  /**
   * Generate a short ID (8 characters)
   */
  static generateShortId(): string {
    return customAlphabet(CUSTOM_ALPHABET, 8)();
  }

  /**
   * Generate a long ID (32 characters)
   */
  static generateLongId(): string {
    return customAlphabet(CUSTOM_ALPHABET, 32)();
  }

  /**
   * Generate an API key format ID
   */
  static generateApiKey(): string {
    return customAlphabet(CUSTOM_ALPHABET, 32)();
  }

  /**
   * Generate a session ID
   */
  static generateSessionId(): string {
    return customAlphabet(CUSTOM_ALPHABET, 16)();
  }

  /**
   * Generate a reference ID (for transactions, orders, etc.)
   */
  static generateReferenceId(): string {
    return customAlphabet(CUSTOM_ALPHABET, 12)();
  }

  /**
   * Generate a secure random string for secrets
   */
  static generateSecureString(length: number = 32): string {
    return customAlphabet(CUSTOM_ALPHABET, length)();
  }

  /**
   * Generate a filename-safe ID
   */
  static generateFilenameId(): string {
    return customAlphabet(CUSTOM_ALPHABET, 16)();
  }

  /**
   * Generate a URL-safe ID
   */
  static generateUrlSafeId(): string {
    return customAlphabet(CUSTOM_ALPHABET, 20)();
  }
}

// Export individual functions for convenience
export const {
  generateMerchantId,
  generateWalletAddress,
  generateTransactionHash,
  generateId,
  generateShortId,
  generateLongId,
  generateApiKey,
  generateSessionId,
  generateReferenceId,
  generateSecureString,
  generateFilenameId,
  generateUrlSafeId
} = IdGenerator;

// Default export
export default IdGenerator;
