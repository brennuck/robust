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
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { useSyncUser } from '@/hooks/useUser';
import { useTheme } from '@/providers';
import { typography, spacing, radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const syncUser = useSyncUser();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = useCallback(async () => {
    if (!isLoaded) return;

    setError('');
    setIsLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message: string }> };
      setError(error.errors?.[0]?.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signUp, email, password, name]);

  const handleVerify = useCallback(async () => {
    if (!isLoaded) return;

    setError('');
    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        syncUser.mutate({ email, name });
        router.replace('/(app)');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message: string }> };
      setError(error.errors?.[0]?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signUp, code, setActive, router, syncUser, email, name]);

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.base }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setPendingVerification(false)}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}20` }]}>
              <Ionicons name="mail-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Check your email</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              We sent a verification code to{'\n'}
              <Text style={{ fontWeight: '600' }}>{email}</Text>
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Verification Code
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.codeInput,
                  { 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  },
                ]}
                placeholder="000000"
                placeholderTextColor={theme.inputPlaceholder}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
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
              onPress={handleVerify}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.textInverse} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.textInverse }]}>
                  Verify Email
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.base }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Create account</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Start your fitness journey today
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  },
                ]}
                placeholder="John Doe"
                placeholderTextColor={theme.inputPlaceholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

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
                  placeholder="Create a password"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
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
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.textInverse} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.textInverse }]}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textTertiary }]}>
              Already have an account?
            </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={[styles.link, { color: theme.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    lineHeight: 22,
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
  codeInput: {
    textAlign: 'center',
    fontSize: typography.sizes.xl,
    letterSpacing: 8,
    fontWeight: '600',
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
