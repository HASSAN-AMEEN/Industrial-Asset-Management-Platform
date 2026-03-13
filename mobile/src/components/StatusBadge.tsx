import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes } from '../utils/theme';

type StatusType =
  | 'active'
  | 'maintenance'
  | 'transit'
  | 'inactive'
  | 'pending'
  | 'delivered'
  | 'delayed'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'IN_WAREHOUSE'
  | 'RESERVED'
  | 'UNDER_SHIPMENT'
  | 'DELIVERED'
  | 'INSTALLED'
  | 'UNDER_MAINTENANCE'
  | 'RETURNED'
  | 'ACTIVE'
  | 'IN_TRANSIT'
  | 'MAINTENANCE'
  | 'RENTED'
  | 'CREATED'
  | 'DISPATCHED'
  | 'CANCELLED';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  showDot?: boolean;
}

const statusColors: Partial<Record<StatusType, { bg: string; text: string; dot: string }>> = {
  active: {
    bg: `${Colors.success}20`,
    text: Colors.success,
    dot: Colors.success,
  },
  maintenance: {
    bg: `${Colors.warning}20`,
    text: Colors.warning,
    dot: Colors.warning,
  },
  transit: {
    bg: `${Colors.secondary}20`,
    text: Colors.secondary,
    dot: Colors.secondary,
  },
  inactive: {
    bg: `${Colors.textMuted}20`,
    text: Colors.textMuted,
    dot: Colors.textMuted,
  },
  pending: {
    bg: `${Colors.warning}20`,
    text: Colors.warning,
    dot: Colors.warning,
  },
  delivered: {
    bg: `${Colors.success}20`,
    text: Colors.success,
    dot: Colors.success,
  },
  delayed: {
    bg: `${Colors.error}20`,
    text: Colors.error,
    dot: Colors.error,
  },
  success: {
    bg: `${Colors.success}20`,
    text: Colors.success,
    dot: Colors.success,
  },
  warning: {
    bg: `${Colors.warning}20`,
    text: Colors.warning,
    dot: Colors.warning,
  },
  error: {
    bg: `${Colors.error}20`,
    text: Colors.error,
    dot: Colors.error,
  },
  info: {
    bg: `${Colors.info}20`,
    text: Colors.info,
    dot: Colors.info,
  },
};

const statusLabels: Partial<Record<StatusType, string>> = {
  active: 'Active',
  maintenance: 'Maintenance',
  transit: 'In Transit',
  inactive: 'Inactive',
  pending: 'Pending',
  delivered: 'Delivered',
  delayed: 'Delayed',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  info: 'Info',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  style,
  showDot = true,
}) => {
  const colors =
    statusColors[status] ||
    ({ bg: `${Colors.info}20`, text: Colors.info, dot: Colors.info } as const);

  const displayLabel = label || statusLabels[status] || String(status);

  const sizeStyles = {
    sm: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      fontSize: FontSizes.xs,
      dotSize: 4,
    },
    md: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      fontSize: FontSizes.sm,
      dotSize: 6,
    },
    lg: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      fontSize: FontSizes.md,
      dotSize: 8,
    },
  }[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        },
        style,
      ]}
    >
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: colors.dot,
              width: sizeStyles.dotSize,
              height: sizeStyles.dotSize,
            },
          ]}
        />
      )}
      <Text style={[styles.label, { color: colors.text, fontSize: sizeStyles.fontSize }]}>
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  label: {
    fontWeight: '500',
  },
});

export default StatusBadge;
