import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection string from environment variables
const connectionString = process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/app_db';

// Create the postgres client with connection options
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  ssl: 'require', // Always require SSL connection
});

// Create the drizzle instance
export const db = drizzle(client, { schema });

// Export schema for use in other files
export * from './schema';
