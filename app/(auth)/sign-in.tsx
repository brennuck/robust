import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { useTheme } from '@/providers';
import { typography, spacing, radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (!isLoaded) return;

    setError('');
    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(app)');
      } else {
        setError('Sign in failed. Please try again.');
      }
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message: string }> };
      setError(error.errors?.[0]?.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signIn, email, password, setActive, router]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.content, { paddingTop: insets.top + spacing.base }]}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Sign in to continue your fitness journey
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.inputText,
                },
              ]}
              placeholder="your@email.com"
              placeholderTextColor={theme.inputPlaceholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  { 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  },
                ]}
                placeholder="Enter your password"
                placeholderTextColor={theme.inputPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={theme.textTertiary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: `${theme.error}15` }]}>
              <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.primary },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.textInverse} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.textInverse }]}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            Don't have an account?
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text style={[styles.link, { color: theme.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
  },
  form: {
    gap: spacing.lg,
  },
  inputContainer: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    borderWidth: 1,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: spacing.base,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorContainer: {
    padding: spacing.md,
    borderRadius: radius.md,
  },
  error: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
  },
  footerText: {
    fontSize: typography.sizes.sm,
  },
  link: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
});
