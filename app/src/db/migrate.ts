import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index';

export async function runMigrations(): Promise<void> {
  try {
    console.log('🔄 Running database migrations...');
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('✅ Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (import.meta.main) {
  runMigrations()
    .then(() => {
      console.log('🎉 All migrations completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration error:', error);
      process.exit(1);
    });
}
