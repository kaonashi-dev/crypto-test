import { AuthService } from '$lib/api/auth';
import type { User } from '$lib/types';

let user = $state<User | null>(null);
let isLoading = $state<boolean>(false);
let isAuthenticated = $derived(user !== null);

// Export getter functions instead of direct state
export const getUser = () => user;
export const getIsLoading = () => isLoading;
export const getIsAuthenticated = () => isAuthenticated;

export async function initializeAuth() {
  isLoading = true;
  try {
    const token = AuthService.getToken();
    if (token) {
      const currentUser = await AuthService.getCurrentUser();
      user = currentUser;
    }
  } catch (error) {
    console.error('Auth initialization failed:', error);
    AuthService.clearToken();
  } finally {
    isLoading = false;
  }
}

export async function login(email: string, password: string) {
  isLoading = true;
  try {
    const response = await AuthService.login({ email, password });
    user = response.user;
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  } finally {
    isLoading = false;
  }
}

export async function logout() {
  isLoading = true;
  try {
    await AuthService.logout();
    user = null;
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    isLoading = false;
  }
}