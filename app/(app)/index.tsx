import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Platform } from 'react-native';
import { Stack, Link } from 'expo-router';
import { useAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import { useUser } from '@/hooks/useUser';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { scheduleLocalNotification } from '@/lib/push-notifications';
import { useState, useCallback } from 'react';

export default function Home() {
  const { signOut } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const { data, isLoading, refetch } = useUser();
  const { expoPushToken, isRegistered } = usePushNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleTestNotification = async () => {
    await scheduleLocalNotification('Test Notification', 'This is a test push notification!', 1);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Stack.Screen options={{ title: 'Home', headerShown: true }} />

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>
          {clerkUser?.firstName || data?.user?.name || 'User'} 👋
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <Link href="/(app)/profile" asChild>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>👤</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Profile</Text>
              <Text style={styles.actionSubtitle}>View and edit your profile</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity style={styles.actionCard} onPress={handleTestNotification}>
          <Text style={styles.actionIcon}>🔔</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Test Notification</Text>
            <Text style={styles.actionSubtitle}>Send a test push notification</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Push Notifications</Text>
            <View style={[styles.statusBadge, isRegistered && styles.statusBadgeActive]}>
              <Text style={[styles.statusText, isRegistered && styles.statusTextActive]}>
                {isRegistered ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {expoPushToken && (
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenLabel}>Push Token:</Text>
              <Text style={styles.tokenValue} numberOfLines={1}>
                {expoPushToken.slice(0, 30)}...
              </Text>
            </View>
          )}

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Backend Sync</Text>
            <View
              style={[styles.statusBadge, data?.user && !isLoading && styles.statusBadgeActive]}
            >
              <Text style={[styles.statusText, data?.user && !isLoading && styles.statusTextActive]}>
                {isLoading ? 'Loading...' : data?.user ? 'Synced' : 'Not Synced'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  welcomeText: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  actionArrow: {
    fontSize: 18,
    color: '#64748B',
  },
  statusCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  statusBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#065F46',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  statusTextActive: {
    color: '#6EE7B7',
  },
  tokenContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  tokenLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  signOutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});

