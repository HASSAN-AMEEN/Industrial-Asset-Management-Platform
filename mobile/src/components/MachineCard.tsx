import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Card from './Card';
import StatusBadge from './StatusBadge';
import { BackendMachineStatus } from '../services/machine';

interface MachineCardProps {
  machine: {
    id: string;
    model: string;
    serialNumber: string;
    category?: string | null;
    status: BackendMachineStatus;
    location: string;
  };
  onPress?: () => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, onPress }) => {
  return (
    <Card onPress={onPress} variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Icon name="cog" size={24} color={Colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.model}>{machine.model}</Text>
          <Text style={styles.metaText}>{machine.category || 'Uncategorized'}</Text>
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
          <Icon name="barcode" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Serial: {machine.serialNumber}</Text>
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
  model: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  metaText: {
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
});

export default MachineCard;
