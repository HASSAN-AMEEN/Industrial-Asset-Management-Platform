import React from 'react';
import { StyleSheet, Pressable, Text, View, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes, Shadows } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: string;
  rightIcon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const variantStyles: Record<string, { container: ViewStyle; text: TextStyle }> = {
    primary: {
      container: {
        backgroundColor: isDisabled ? Colors.primaryDark : Colors.primary,
      },
      text: {
        color: Colors.white,
      },
    },
    secondary: {
      container: {
        backgroundColor: isDisabled ? Colors.secondaryDark : Colors.secondary,
      },
      text: {
        color: Colors.white,
      },
    },
    outline: {
      container: {
        backgroundColor: Colors.transparent,
        borderWidth: 1,
        borderColor: isDisabled ? Colors.border : Colors.primary,
      },
      text: {
        color: isDisabled ? Colors.textMuted : Colors.primary,
      },
    },
    ghost: {
      container: {
        backgroundColor: Colors.transparent,
      },
      text: {
        color: isDisabled ? Colors.textMuted : Colors.primary,
      },
    },
    danger: {
      container: {
        backgroundColor: isDisabled ? Colors.errorDark : Colors.error,
      },
      text: {
        color: Colors.white,
      },
    },
  };

  const sizeStyles: Record<string, { container: ViewStyle; text: TextStyle; iconSize: number }> = {
    sm: {
      container: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        minHeight: 36,
      },
      text: {
        fontSize: FontSizes.sm,
      },
      iconSize: 16,
    },
    md: {
      container: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        minHeight: 44,
      },
      text: {
        fontSize: FontSizes.md,
      },
      iconSize: 18,
    },
    lg: {
      container: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        minHeight: 52,
      },
      text: {
        fontSize: FontSizes.lg,
      },
      iconSize: 20,
    },
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        currentVariant.container,
        currentSize.container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={currentVariant.text.color} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon && (
            <Icon
              name={leftIcon}
              size={currentSize.iconSize}
              color={currentVariant.text.color as string}
              style={styles.leftIcon}
            />
          )}
          <Text style={[styles.text, currentVariant.text, currentSize.text, textStyle]}>
            {title}
          </Text>
          {rightIcon && (
            <Icon
              name={rightIcon}
              size={currentSize.iconSize}
              color={currentVariant.text.color as string}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
});

export default Button;
