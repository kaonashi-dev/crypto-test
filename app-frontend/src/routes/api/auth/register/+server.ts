import { UserService } from '$lib/db/services/user';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      return json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const user = await UserService.createUser({
      email,
      password,
      name: name || null,
    });

    // Generate token for the new user
    const token = UserService.generateToken(user);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return json({
      user: userWithoutPassword,
      token,
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
