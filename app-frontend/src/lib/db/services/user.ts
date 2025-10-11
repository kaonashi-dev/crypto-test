import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db, merchants, usersBackoffice, type Merchant, type NewUser, type User } from '../index';

export class UserService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
  private static readonly SALT_ROUNDS = 10;

  /**
   * Create a new user with hashed password
   */
  static async createUser(userData: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);
    
    const [user] = await db.insert(usersBackoffice).values({
      ...userData,
      password: hashedPassword,
    }).returning();

    return user;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(usersBackoffice).where(eq(usersBackoffice.email, email));
    return user || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id: number): Promise<User | null> {
    const [user] = await db.select().from(usersBackoffice).where(eq(usersBackoffice.id, id));
    return user || null;
  }

  /**
   * Find user by merchant ID
   */
  static async findByMerchantId(merchantId: number): Promise<User | null> {
    const [user] = await db.select().from(usersBackoffice).where(eq(usersBackoffice.merchantId, merchantId));
    return user || null;
  }

  /**
   * Find merchant by merchantId (string)
   */
  static async findMerchantByMerchantId(merchantId: string): Promise<Merchant | null> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.merchantId, merchantId));
    return merchant || null;
  }

  /**
   * Find merchant by ID
   */
  static async findMerchantById(id: number): Promise<Merchant | null> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant || null;
  }

  /**
   * Verify user password
   */
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generate JWT token for user
   */
  static async generateToken(user: User): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (24 * 60 * 60); // 24 hours from now
    
    // Get the merchant to get the merchantId string
    const merchant = await this.findMerchantById(user.merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }
    
    return jwt.sign(
      { 
        merchantId: merchant.merchantId,
        iat: now,
        exp: exp
      },
      this.JWT_SECRET
    );
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): { merchantId: string; iat: number; exp: number } | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { merchantId: string; iat: number; exp: number };
    } catch (error) {
      return null;
    }
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticate(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    const token = await this.generateToken(user);
    return { user, token };
  }
}
