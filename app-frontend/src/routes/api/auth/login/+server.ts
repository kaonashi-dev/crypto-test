import { UserService } from '$lib/db/services/user';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await UserService.authenticate(email, password);
    
    if (!result) {
      return json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { user, token } = result;

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return json({
      user: userWithoutPassword,
      token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
