import Constants from 'expo-constants';

// API URL - defaults to localhost for development
// In production, set EXPO_PUBLIC_API_URL in your environment
export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3001/api';

// Clerk Publishable Key
export const CLERK_PUBLISHABLE_KEY =
  Constants.expoConfig?.extra?.clerkPublishableKey ||
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  '';

