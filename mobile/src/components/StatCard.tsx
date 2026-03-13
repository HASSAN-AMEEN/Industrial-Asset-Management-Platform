import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes, Shadows } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconColor = Colors.primary,
  iconBgColor,
  trend,
  style,
  size = 'md',
}) => {
  const bgColor = iconBgColor || `${iconColor}20`;

  const sizeStyles = {
    sm: {
      iconSize: 20,
      iconContainer: 36,
      valueSize: FontSizes.xl,
      titleSize: FontSizes.xs,
      padding: Spacing.md,
    },
    md: {
      iconSize: 24,
      iconContainer: 44,
      valueSize: FontSizes.xxl,
      titleSize: FontSizes.sm,
      padding: Spacing.lg,
    },
    lg: {
      iconSize: 28,
      iconContainer: 52,
      valueSize: FontSizes.xxxl,
      titleSize: FontSizes.md,
      padding: Spacing.xl,
    },
  }[size];

  return (
    <Card style={[{ padding: sizeStyles.padding }, style]} variant="elevated">
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: bgColor,
              width: sizeStyles.iconContainer,
              height: sizeStyles.iconContainer,
            },
          ]}
        >
          <Icon name={icon} size={sizeStyles.iconSize} color={iconColor} />
        </View>
        {trend && (
          <View style={[styles.trend, trend.isPositive ? styles.trendUp : styles.trendDown]}>
            <Icon
              name={trend.isPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.isPositive ? Colors.success : Colors.error}
            />
            <Text
              style={[
                styles.trendText,
                { color: trend.isPositive ? Colors.success : Colors.error },
              ]}
            >
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.value, { fontSize: sizeStyles.valueSize }]}>{value}</Text>
      <Text style={[styles.title, { fontSize: sizeStyles.titleSize }]}>{title}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  trendUp: {
    backgroundColor: `${Colors.success}20`,
  },
  trendDown: {
    backgroundColor: `${Colors.error}20`,
  },
  trendText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginLeft: 2,
  },
  value: {
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  title: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default StatCard;
