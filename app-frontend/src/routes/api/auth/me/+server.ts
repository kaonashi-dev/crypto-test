import { UserService } from '$lib/db/services/user';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = UserService.verifyToken(token);
    
    if (!decoded) {
      return json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // First find the merchant to get the internal ID
    const merchant = await UserService.findMerchantByMerchantId(decoded.merchantId);
    if (!merchant) {
      return json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Then find the user by the merchant's internal ID
    const user = await UserService.findByMerchantId(merchant.id);
    
    if (!user || !user.isActive) {
      return json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return json({
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
