import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import { useTheme } from '@/providers';
import { typography, spacing, radius } from '@/lib/theme';

export default function Profile() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const { theme, mode, isDark, setMode, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  const name = clerkUser?.firstName 
    ? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ''}`
    : 'User';

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={[styles.avatarText, { color: theme.textInverse }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
        <Text style={[styles.email, { color: theme.textTertiary }]}>
          {clerkUser?.primaryEmailAddress?.emailAddress}
        </Text>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
          Appearance
        </Text>
        
        <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setMode('light')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="sunny-outline" size={22} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Light</Text>
            </View>
            {mode === 'light' && (
              <Ionicons name="checkmark" size={20} color={theme.primary} />
            )}
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setMode('dark')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={22} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Dark</Text>
            </View>
            {mode === 'dark' && (
              <Ionicons name="checkmark" size={20} color={theme.primary} />
            )}
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setMode('system')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait-outline" size={22} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>System</Text>
            </View>
            {mode === 'system' && (
              <Ionicons name="checkmark" size={20} color={theme.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
          Account
        </Text>
        
        <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="settings-outline" size={22} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Preferences
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={22} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={22} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Help & Support
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={[styles.signOutButton, { borderColor: theme.error }]}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={20} color={theme.error} />
        <Text style={[styles.signOutText, { color: theme.error }]}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: theme.textTertiary }]}>
        Robust v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  avatarText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '700',
  },
  name: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: typography.sizes.sm,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  settingsCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingLabel: {
    fontSize: typography.sizes.base,
  },
  divider: {
    height: 1,
    marginLeft: spacing.base + 22 + spacing.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
  },
  signOutText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  version: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },
});
