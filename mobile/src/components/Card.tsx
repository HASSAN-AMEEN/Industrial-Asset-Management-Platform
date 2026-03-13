import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle, Pressable } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'md',
}) => {
  const paddingValue = {
    none: 0,
    sm: Spacing.sm,
    md: Spacing.lg,
    lg: Spacing.xl,
  }[padding];

  const variantStyles: ViewStyle = {
    default: {
      backgroundColor: Colors.backgroundElevated,
    },
    outlined: {
      backgroundColor: Colors.transparent,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    elevated: {
      backgroundColor: Colors.backgroundElevated,
      ...Shadows.md,
    },
  }[variant];

  const content = (
    <View style={[styles.card, variantStyles, { padding: paddingValue }, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
  },
});

export default Card;
