import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/providers';
import { typography, spacing, radius } from '@/lib/theme';

export default function Welcome() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Decorative gradient orbs */}
      <View style={styles.decorativeOrb1} />
      <View style={styles.decorativeOrb2} />
      
      <View style={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
        {/* Logo / Brand */}
        <View style={styles.brandSection}>
          <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={[styles.brandName, { color: theme.text }]}>Robust</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Your personal fitness companion
          </Text>
        </View>

        {/* Value Props */}
        <View style={styles.features}>
          <FeatureItem 
            emoji="✨" 
            title="Simple & Elegant"
            description="Track workouts without the clutter"
            theme={theme}
          />
          <FeatureItem 
            emoji="📈" 
            title="See Your Progress"
            description="Personal records, tracked automatically"
            theme={theme}
          />
          <FeatureItem 
            emoji="⚡" 
            title="Quick Logging"
            description="Log sets in seconds, not minutes"
            theme={theme}
          />
        </View>

        {/* CTAs */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <Text style={[styles.primaryButtonText, { color: theme.textInverse }]}>
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.border }]}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function FeatureItem({ 
  emoji, 
  title, 
  description, 
  theme 
}: { 
  emoji: string; 
  title: string; 
  description: string;
  theme: any;
}) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: theme.textTertiary }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativeOrb1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(134, 167, 137, 0.15)',
  },
  decorativeOrb2: {
    position: 'absolute',
    bottom: -50,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'space-between',
  },
  brandSection: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  brandName: {
    fontSize: typography.sizes['3xl'],
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: typography.sizes.md,
    letterSpacing: 0.3,
  },
  features: {
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  featureEmoji: {
    fontSize: 28,
    width: 48,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: typography.sizes.sm,
  },
  actions: {
    gap: spacing.md,
  },
  primaryButton: {
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
  },
});

