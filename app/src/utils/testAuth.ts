// Script de prueba para verificar la autenticación
const BASE_URL = 'http://localhost:3000';

interface TokenResponse {
  success: boolean;
  data?: {
    token: string;
    expiresIn: number;
  };
  error?: string;
  message?: string;
}

interface ProfileResponse {
  success: boolean;
  data?: {
    id: number;
    merchantId: string;
    name: string;
    email: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}

async function testAuth(): Promise<void> {
  console.log('🧪 Testing Authentication Flow');
  console.log('=' .repeat(50));
  
  try {
    // 1. Obtener token
    console.log('1. Getting authentication token...');
    const tokenResponse = await fetch(`${BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'X-Merchant-ID': 'V1StGXR8Z5jdHi6BmyT', // Usar un ID del seed
        'Merchant-Secret': 'SecurePass123!',
        'Content-Type': 'application/json'
      }
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }
    
    const tokenData: TokenResponse = await tokenResponse.json();
    console.log('✅ Token obtained:', tokenData.success);
    
    if (!tokenData.success || !tokenData.data) {
      throw new Error(`Token error: ${tokenData.error || 'No token data'}`);
    }
    
    const token = tokenData.data.token;
    console.log('🔑 Token:', token.substring(0, 20) + '...');
    
    // 2. Probar endpoint de merchant profile
    console.log('\n2. Testing merchant profile endpoint...');
    const profileResponse = await fetch(`${BASE_URL}/merchant/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!profileResponse.ok) {
      throw new Error(`Profile request failed: ${profileResponse.status}`);
    }
    
    const profileData: ProfileResponse = await profileResponse.json();
    console.log('✅ Profile response:', profileData.success);
    
    if (profileData.success && profileData.data) {
      console.log('👤 Merchant data:');
      console.log('   Name:', profileData.data.name);
      console.log('   Email:', profileData.data.email);
      console.log('   Status:', profileData.data.status);
      console.log('   Merchant ID:', profileData.data.merchantId);
    } else {
      console.log('❌ Profile error:', profileData.error);
    }
    
    // 3. Probar sin token
    console.log('\n3. Testing without token (should fail)...');
    const noTokenResponse = await fetch(`${BASE_URL}/merchant/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const noTokenData: ProfileResponse = await noTokenResponse.json();
    console.log('✅ No token response:', noTokenData.success);
    console.log('   Error:', noTokenData.error);
    
    // 4. Probar con token inválido
    console.log('\n4. Testing with invalid token (should fail)...');
    const invalidTokenResponse = await fetch(`${BASE_URL}/merchant/profile`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-123',
        'Content-Type': 'application/json'
      }
    });
    
    const invalidTokenData: ProfileResponse = await invalidTokenResponse.json();
    console.log('✅ Invalid token response:', invalidTokenData.success);
    console.log('   Error:', invalidTokenData.error);
    
    console.log('\n🎉 Authentication test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
  }
}

// Función para probar con credenciales personalizadas
export async function testAuthWithCredentials(
  merchantId: string, 
  merchantSecret: string
): Promise<void> {
  console.log('🧪 Testing Authentication with Custom Credentials');
  console.log('=' .repeat(60));
  
  try {
    // Obtener token
    console.log('Getting authentication token...');
    const tokenResponse = await fetch(`${BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'X-Merchant-ID': merchantId,
        'Merchant-Secret': merchantSecret,
        'Content-Type': 'application/json'
      }
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }
    
    const tokenData: TokenResponse = await tokenResponse.json();
    
    if (!tokenData.success || !tokenData.data) {
      throw new Error(`Token error: ${tokenData.error || 'No token data'}`);
    }
    
    const token = tokenData.data.token;
    console.log('✅ Token obtained successfully');
    console.log('🔑 Token:', token.substring(0, 20) + '...');
    
    // Probar endpoint de merchant profile
    console.log('\nTesting merchant profile endpoint...');
    const profileResponse = await fetch(`${BASE_URL}/merchant/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const profileData: ProfileResponse = await profileResponse.json();
    
    if (profileData.success && profileData.data) {
      console.log('✅ Profile retrieved successfully');
      console.log('👤 Merchant data:');
      console.log('   Name:', profileData.data.name);
      console.log('   Email:', profileData.data.email);
      console.log('   Status:', profileData.data.status);
      console.log('   Merchant ID:', profileData.data.merchantId);
    } else {
      console.log('❌ Profile error:', profileData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
  }
}

// Ejecutar si se llama directamente
if (import.meta.main) {
  testAuth();
}
