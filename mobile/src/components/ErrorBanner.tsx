import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { ParsedApiError } from '../utils/errors';

interface ErrorBannerProps {
  /** Pass `null` to hide the banner entirely. */
  error: ParsedApiError | string | null;
  onDismiss?: () => void;
  style?: ViewStyle;
}

const resolve = (error: ErrorBannerProps['error']) => {
  if (!error) return null;
  if (typeof error === 'string') {
    return { title: error, description: '', icon: 'alert-outline' };
  }
  return { title: error.title, description: error.description, icon: error.icon ?? 'alert-outline' };
};

/**
 * Compact slide-down banner used in forms and modals to communicate a transient
 * failure (e.g. submit error). Auto-fades when the parent clears the error.
 */
export const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onDismiss, style }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-8)).current;
  const resolved = resolve(error);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: resolved ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: resolved ? 0 : -8,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, resolved]);

  if (!resolved) return null;

  return (
    <Animated.View style={[styles.container, style, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.iconWrap}>
        <Icon name={resolved.icon} size={18} color={Colors.error} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{resolved.title}</Text>
        {!!resolved.description && (
          <Text style={styles.description}>{resolved.description}</Text>
        )}
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8} style={styles.dismiss}>
          <Icon name="close" size={16} color={Colors.textMuted} />
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Colors.error}10`,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.error}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    marginTop: 2,
    lineHeight: FontSizes.xs * 1.5,
  },
  dismiss: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ErrorBanner;
