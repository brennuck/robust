import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  registerTokenWithBackend,
  addNotificationListeners,
} from '@/lib/push-notifications';
import { useAuth } from '@clerk/clerk-expo';

export function usePushNotifications() {
  const { isSignedIn } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const hasRegisteredRef = useRef(false);

  const registerPushNotifications = useCallback(async () => {
    if (hasRegisteredRef.current) return;

    const token = await registerForPushNotifications();
    if (token) {
      setExpoPushToken(token);

      // Register with backend if signed in
      if (isSignedIn) {
        const success = await registerTokenWithBackend(token);
        setIsRegistered(success);
        if (success) {
          hasRegisteredRef.current = true;
        }
      }
    }
  }, [isSignedIn]);

  useEffect(() => {
    // Set up notification listeners
    const cleanup = addNotificationListeners(
      (notification) => setNotification(notification),
      (response) => {
        // Handle notification response (user tapped on notification)
        console.log('User tapped notification:', response.notification.request.content);
      }
    );

    return cleanup;
  }, []);

  useEffect(() => {
    if (isSignedIn && expoPushToken && !hasRegisteredRef.current) {
      registerTokenWithBackend(expoPushToken).then((success) => {
        setIsRegistered(success);
        if (success) {
          hasRegisteredRef.current = true;
        }
      });
    }
  }, [isSignedIn, expoPushToken]);

  return {
    expoPushToken,
    isRegistered,
    notification,
    registerPushNotifications,
  };
}

