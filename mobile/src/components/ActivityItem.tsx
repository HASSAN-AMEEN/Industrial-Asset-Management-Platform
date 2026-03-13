import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Activity, ActivityType } from '../types';

interface ActivityItemProps {
  activity: Activity;
  onPress?: () => void;
}

const activityConfig: Record<ActivityType, { icon: string; color: string }> = {
  shipment: { icon: 'truck-delivery', color: Colors.secondary },
  maintenance: { icon: 'wrench', color: Colors.warning },
  installation: { icon: 'check-circle', color: Colors.success },
  alert: { icon: 'alert-circle', color: Colors.error },
};

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onPress }) => {
  const config = activityConfig[activity.type];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
        <Icon name={config.icon} size={18} color={config.color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {activity.description}
        </Text>
      </View>
      <Text style={styles.timestamp}>{activity.timestamp}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  pressed: {
    backgroundColor: Colors.backgroundHover,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginBottom: 2,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * 1.4,
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
});

export default ActivityItem;
