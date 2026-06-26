import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { ParsedApiError } from '../utils/errors';
import Button from './Button';

interface ErrorStateProps {
  /** Pre-parsed error, or a string title to render directly. */
  error: ParsedApiError | string;
  /** Override the title coming from `error`. */
  title?: string;
  /** Override the description coming from `error`. */
  description?: string;
  /** Override the icon coming from `error`. */
  icon?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
  /** Render in a compact horizontal layout instead of full-screen vertical. */
  variant?: 'full' | 'inline';
}

const isParsed = (e: ErrorStateProps['error']): e is ParsedApiError =>
  typeof e === 'object' && e !== null && 'kind' in e;

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title,
  description,
  icon,
  onRetry,
  retryLabel = 'Try again',
  style,
  variant = 'full',
}) => {
  const parsed = isParsed(error) ? error : null;
  const resolvedTitle = title ?? parsed?.title ?? (typeof error === 'string' ? error : 'Something went wrong');
  const resolvedDescription = description ?? parsed?.description ?? '';
  const resolvedIcon = icon ?? parsed?.icon ?? 'alert-outline';

  if (variant === 'inline') {
    return (
      <View style={[styles.inline, style]}>
        <View style={styles.inlineIcon}>
          <Icon name={resolvedIcon} size={20} color={Colors.error} />
        </View>
        <View style={styles.inlineText}>
          <Text style={styles.inlineTitle}>{resolvedTitle}</Text>
          {!!resolvedDescription && (
            <Text style={styles.inlineDescription}>{resolvedDescription}</Text>
          )}
        </View>
        {onRetry && (
          <Button title={retryLabel} variant="outline" size="sm" onPress={onRetry} />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Icon name={resolvedIcon} size={44} color={Colors.error} />
      </View>
      <Text style={styles.title}>{resolvedTitle}</Text>
      {!!resolvedDescription && <Text style={styles.description}>{resolvedDescription}</Text>}
      {onRetry && (
        <Button
          title={retryLabel}
          onPress={onRetry}
          variant="primary"
          size="md"
          style={styles.button}
          leftIcon="refresh"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Full
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: FontSizes.md * 1.5,
    maxWidth: 320,
  },
  button: {
    marginTop: Spacing.lg,
    minWidth: 140,
  },
  // Inline
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: `${Colors.error}10`,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  inlineIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.error}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineText: {
    flex: 1,
  },
  inlineTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  inlineDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    marginTop: 2,
    lineHeight: FontSizes.xs * 1.5,
  },
});

export default ErrorState;
