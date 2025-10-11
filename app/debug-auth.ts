// Script de depuración para probar la autenticación
import { testAuthWithCredentials } from './src/utils/testAuth.js';

async function debugAuth() {
  console.log('🐛 Debugging Authentication');
  console.log('=' .repeat(40));
  
  try {
    // Usar credenciales del seed
    await testAuthWithCredentials('V1StGXR8Z5jdHi6BmyT', 'SecurePass123!');
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

// Ejecutar si se llama directamente
if (import.meta.main) {
  debugAuth();
}
