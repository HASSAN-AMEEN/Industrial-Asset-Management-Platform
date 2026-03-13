import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Card from './Card';
import StatusBadge from './StatusBadge';
import { Machine } from '../types';

interface MachineCardProps {
  machine: Machine;
  onPress?: () => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, onPress }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 50) return Colors.warning;
    return Colors.error;
  };

  return (
    <Card onPress={onPress} variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Icon name="cog" size={24} color={Colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.serialNumber}>{machine.serialNumber}</Text>
          <Text style={styles.model}>{machine.model}</Text>
        </View>
        <StatusBadge status={machine.status} size="sm" />
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Icon name="map-marker" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{machine.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="wrench" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Next service: {machine.nextService}</Text>
        </View>
      </View>

      <View style={styles.healthContainer}>
        <View style={styles.healthHeader}>
          <Text style={styles.healthLabel}>Health Score</Text>
          <Text style={[styles.healthValue, { color: getHealthColor(machine.healthScore) }]}>
            {machine.healthScore}%
          </Text>
        </View>
        <View style={styles.healthBarBg}>
          <View
            style={[
              styles.healthBar,
              {
                width: `${machine.healthScore}%`,
                backgroundColor: getHealthColor(machine.healthScore),
              },
            ]}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  serialNumber: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  model: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  details: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginLeft: Spacing.sm,
  },
  healthContainer: {
    marginTop: Spacing.md,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  healthLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  healthValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  healthBarBg: {
    height: 6,
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  healthBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});

export default MachineCard;
