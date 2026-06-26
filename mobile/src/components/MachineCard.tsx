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
  statusUpdating?: boolean;
  onPress?: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  onStatusPress?: () => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  statusUpdating = false,
  onPress,
  onEditPress,
  onDeletePress,
  onStatusPress,
}) => {
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
        <Pressable disabled={statusUpdating} onPress={onStatusPress} style={styles.statusPressable}>
          <StatusBadge status={machine.status} size="md" />
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.detailRowBetween}>
          <View style={styles.detailRowLeft}>
            <Icon name="map-marker" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{machine.location}</Text>
          </View>
          <View style={styles.actionsRow}>
            {onEditPress && (
              <Pressable onPress={onEditPress} style={styles.actionButton}>
                <Icon name="pencil" size={16} color={Colors.info} />
              </Pressable>
            )}
            {onDeletePress && (
              <Pressable onPress={onDeletePress} style={styles.actionButton}>
                <Icon name="trash-can-outline" size={16} color={Colors.error} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.detailRow}>
          <Icon name="barcode" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Serial: {machine.serialNumber}</Text>
        </View>
      </View>

      <View style={styles.detailsFooter}>
        <Text style={styles.detailsHint}>Tap for details & status history</Text>
        <Icon name="chevron-right" size={18} color={Colors.textMuted} />
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
  statusPressable: {
    opacity: 0.95,
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
  detailRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginLeft: Spacing.sm,
    flexShrink: 1,
  },
  editButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionButton: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  detailsFooter: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsHint: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  historyContainer: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  historyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  historyEmpty: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
  },
  historyItem: {
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  historyDate: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginLeft: 'auto',
    paddingLeft: Spacing.sm,
  },
  initialText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  arrowText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginHorizontal: Spacing.xs,
  },
  historyMeta: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  expandText: {
    color: Colors.info,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
});

export default MachineCard;
