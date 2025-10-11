import { db } from './database';

// Database initialization function
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database connection...');
    
    // Test the connection
    const isConnected = await db.testConnection();
    
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Create tables if they don't exist
export async function createTables(): Promise<void> {
  try {
    console.log('Creating database tables...');

    // Create merchants table
    await db.query(`
      CREATE TABLE IF NOT EXISTS merchants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create wallets table
    await db.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
        address VARCHAR(255) UNIQUE NOT NULL,
        private_key_encrypted TEXT NOT NULL,
        balance DECIMAL(20, 8) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'BTC',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create transactions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
        tx_hash VARCHAR(255) UNIQUE NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('send', 'receive')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_merchants_email ON merchants(email)
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_wallets_merchant_id ON wallets(merchant_id)
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address)
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id)
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash)
    `);

    console.log('Database tables created successfully!');
  } catch (error) {
    console.error('Failed to create database tables:', error);
    throw error;
  }
}
