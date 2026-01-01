import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { Providers, useTheme } from '@/providers';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSyncUser } from '@/hooks/useUser';

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isDark, theme } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const { registerPushNotifications } = usePushNotifications();
  const syncUser = useSyncUser();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      router.replace('/(app)');
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)');
    }
  }, [isLoaded, isSignedIn, segments]);

  useEffect(() => {
    if (isSignedIn) {
      registerPushNotifications();
      syncUser.mutate({});
    }
  }, [isSignedIn]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="workout/[id]" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen 
          name="workout/[id]/add-exercise" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerShadowVisible: false,
            title: 'Add Exercise',
          }} 
        />
        <Stack.Screen name="workout/[id]/summary" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen 
          name="templates/new" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerShadowVisible: false,
            title: 'New Routine',
          }} 
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Providers>
        <RootLayoutNav />
      </Providers>
    </SafeAreaProvider>
  );
}
