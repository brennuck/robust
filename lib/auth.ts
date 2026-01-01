import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'clerk_session_token';

// Token cache for Clerk with SecureStore
export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting token from SecureStore:', error);
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error saving token to SecureStore:', error);
    }
  },
  async clearToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error clearing token from SecureStore:', error);
    }
  },
};

// Get current auth token - to be called from API client
// This will be set by the auth provider
let getTokenFn: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  getTokenFn = fn;
}

export async function getToken(): Promise<string | null> {
  if (getTokenFn) {
    return getTokenFn();
  }
  return null;
}

