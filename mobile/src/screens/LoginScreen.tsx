import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { Button, Input } from '../components';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useResponsive } from '../hooks/useResponsive';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
const NETWORK_ERROR_MESSAGE = 'Unable to connect. Please check your connection and try again';
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again';

const mapLoginErrorMessage = (error: unknown): string => {
  const maybeError = error as {
    message?: string;
    code?: string;
    response?: { status?: number; data?: { message?: string; error?: string } };
  };

  const responseStatus = maybeError?.response?.status;
  const responseMessage = (
    maybeError?.response?.data?.message || maybeError?.response?.data?.error || ''
  ).toLowerCase();
  const rawMessage = (maybeError?.message || '').toLowerCase();
  const code = (maybeError?.code || '').toLowerCase();

  if (
    responseStatus === 401 ||
    responseMessage.includes('invalid email or password') ||
    responseMessage.includes('invalid credentials') ||
    rawMessage.includes('invalid email or password') ||
    rawMessage.includes('invalid credentials')
  ) {
    return INVALID_CREDENTIALS_MESSAGE;
  }

  if (
    code === 'err_network' ||
    code === 'econnaborted' ||
    rawMessage.includes('network error') ||
    rawMessage.includes('timeout') ||
    rawMessage.includes('failed to fetch') ||
    rawMessage.includes('unable to connect')
  ) {
    return NETWORK_ERROR_MESSAGE;
  }

  return GENERIC_ERROR_MESSAGE;
};

interface LoginScreenProps {
  onLogin?: (email: string, password: string) => Promise<void> | void;
  onNavigateToSignup?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { hp } = useResponsive();

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setErrorMessage('');

    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await onLogin?.(email.trim(), password);
    } catch (error) {
      setErrorMessage(mapLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { minHeight: hp(100) - 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Icon name="cog-outline" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.appName}>Tayyab Traders</Text>
            <Text style={styles.tagline}>Industrial Equipment Management</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.instructionText}>
              Sign in to continue managing your equipment fleet
            </Text>

            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="email-outline"
                error={errors.email}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (errorMessage) setErrorMessage('');
                }}
                secureTextEntry
                leftIcon="lock-outline"
                error={errors.password}
              />

              <Pressable style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Pressable>

              {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="lg"
                rightIcon="arrow-right"
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {"Don't have an account? "}
              <Text style={styles.footerLink} onPress={onNavigateToSignup}>Sign Up</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  welcomeText: {
    fontSize: FontSizes.xxl,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  instructionText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    lineHeight: FontSizes.md * 1.5,
  },
  form: {},
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
    marginTop: -Spacing.sm,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
  },
  footer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '500',
  },
});

export default LoginScreen;
