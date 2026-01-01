import { useEffect } from 'react';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { tokenCache, setTokenGetter } from '@/lib/auth';
import { CLERK_PUBLISHABLE_KEY } from '@/lib/constants';

// Component to sync auth token getter
function AuthSync({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set the token getter for the API client
    setTokenGetter(getToken);
  }, [getToken]);

  return <>{children}</>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error(
      'Missing CLERK_PUBLISHABLE_KEY. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your environment.'
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthSync>{children}</AuthSync>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
