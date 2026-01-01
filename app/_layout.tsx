import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@clerk/clerk-expo';
import { Providers } from '@/providers';
import { usePushNotifications } from '@/hooks/usePushNotifications';

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { registerPushNotifications } = usePushNotifications();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      // User is signed in but on auth screen, redirect to main app
      router.replace('/(app)');
    } else if (!isSignedIn && !inAuthGroup) {
      // User is not signed in and not on auth screen, redirect to sign in
      router.replace('/(auth)/sign-in');
    }
  }, [isLoaded, isSignedIn, segments]);

  useEffect(() => {
    if (isSignedIn) {
      // Register for push notifications when signed in
      registerPushNotifications();
    }
  }, [isSignedIn, registerPushNotifications]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <RootLayoutNav />
    </Providers>
  );
}
