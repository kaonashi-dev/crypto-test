import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  /**
   * Generate a random encryption key
   */
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static encrypt(text: string, key: string): string {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, keyBuffer);
      cipher.setAAD(Buffer.from('wallet-key', 'utf8'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine IV + tag + encrypted data
      return iv.toString('hex') + tag.toString('hex') + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decrypt(encryptedData: string, key: string): string {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      
      // Extract IV, tag, and encrypted data
      const iv = Buffer.from(encryptedData.substring(0, this.IV_LENGTH * 2), 'hex');
      const tag = Buffer.from(
        encryptedData.substring(this.IV_LENGTH * 2, (this.IV_LENGTH + this.TAG_LENGTH) * 2), 
        'hex'
      );
      const encrypted = encryptedData.substring((this.IV_LENGTH + this.TAG_LENGTH) * 2);
      
      const decipher = crypto.createDecipher(this.ALGORITHM, keyBuffer);
      decipher.setAAD(Buffer.from('wallet-key', 'utf8'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Generate a secure random string for private keys
   */
  static generateSecureRandom(length: number = 64): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a string using SHA-256
   */
  static hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Generate a wallet private key for different networks
   */
  static generateWalletPrivateKey(network: string): string {
    // For demo purposes, generate a random hex string
    // In production, you would use proper cryptographic key generation
    const keyLength = network === 'bitcoin' ? 32 : 32; // 256 bits
    return this.generateSecureRandom(keyLength);
  }
}
