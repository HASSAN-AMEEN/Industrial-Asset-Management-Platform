import React from 'react';
import { StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface FABProps {
  icon: string;
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  color = Colors.white,
  backgroundColor = Colors.primary,
  size = 'md',
  style,
}) => {
  const sizeStyles = {
    sm: { size: 44, iconSize: 20 },
    md: { size: 56, iconSize: 24 },
    lg: { size: 68, iconSize: 28 },
  }[size];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        {
          width: sizeStyles.size,
          height: sizeStyles.size,
          backgroundColor,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon name={icon} size={sizeStyles.iconSize} color={color} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
});

export default FAB;
