import type { AuthRequest, AuthResponse, JWTPayload, ApiResponse } from '@/types';
import { MerchantQueries } from '@/db/queries/merchantQueries';
import { IdGenerator } from '@/utils/idGenerator';
import crypto from 'crypto';

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: number;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.jwtExpiresIn = parseInt(process.env.JWT_EXPIRES_IN || '3600');
  }

  async authenticate(authData: AuthRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // Find merchant by merchantId (nanoid)
      const merchant = await MerchantQueries.findByMerchantId(authData.merchantId);

      if (!merchant) {
        return {
          success: false,
          error: 'Merchant not found'
        };
      }

      if (merchant.status !== 'active') {
        return {
          success: false,
          error: 'Merchant account is inactive'
        };
      }

      // Verify merchant secret
      const isValidSecret = await this.verifyMerchantSecret(authData.merchantSecret, merchant.merchantSecret);
      
      if (!isValidSecret) {
        return {
          success: false,
          error: 'Invalid merchant secret'
        };
      }

      const payload: JWTPayload = {
        merchantId: merchant.merchantId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.jwtExpiresIn
      };

      const token = this.generateJWT(payload);

      return {
        success: true,
        data: {
          token,
          expiresIn: this.jwtExpiresIn
        },
        message: 'Authentication successful'
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = this.decodeJWT(token);
      
      if (!decoded || !decoded.exp) {
        return null;
      }

      if (Date.now() >= decoded.exp * 1000) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Generate a secure merchant secret hash
  static async hashMerchantSecret(secret: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(secret, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  // Verify merchant secret against stored hash
  private async verifyMerchantSecret(secret: string, hashedSecret: string): Promise<boolean> {
    try {
      const [salt, hash] = hashedSecret.split(':');
      if (!salt || !hash) {
        return false;
      }
      const verifyHash = crypto.pbkdf2Sync(secret, salt, 10000, 64, 'sha512').toString('hex');
      return hash === verifyHash;
    } catch (error) {
      return false;
    }
  }

  // Generate a new merchant ID
  static generateMerchantId(): string {
    return IdGenerator.generateMerchantId();
  }

  private generateJWT(payload: JWTPayload): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`, this.jwtSecret);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private decodeJWT(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [header, payload, signature] = parts;
      
      if (!header || !payload || !signature) {
        return null;
      }
      
      const expectedSignature = this.sign(`${header}.${payload}`, this.jwtSecret);
      if (signature !== expectedSignature) {
        return null;
      }

      return JSON.parse(this.base64UrlDecode(payload));
    } catch (error) {
      return null;
    }
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    const paddedStr = str + '='.repeat((4 - str.length % 4) % 4);
    return Buffer.from(paddedStr.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
  }

  private sign(data: string, secret: string): string {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

export const authService = new AuthService();