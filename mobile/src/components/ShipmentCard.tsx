import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Card from './Card';
import { BackendShipment } from '../services/shipment';

interface ShipmentCardProps {
  shipment: BackendShipment;
  onPress?: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDispatch?: () => void;
  onDeliver?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

const formatDate = (value?: string | null): string => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

const statusStyleMap: Record<string, { backgroundColor: string; color: string }> = {
  CREATED: { backgroundColor: '#3A475E', color: '#D7E3FC' },
  IN_TRANSIT: { backgroundColor: '#5B4A23', color: '#FCE8B2' },
  DISPATCHED: { backgroundColor: '#5B4A23', color: '#FCE8B2' },
  DELIVERED: { backgroundColor: '#1E5132', color: '#B7E4C7' },
  CANCELLED: { backgroundColor: '#4B5563', color: '#D1D5DB' },
};

export const ShipmentCard: React.FC<ShipmentCardProps> = ({
  shipment,
  onPress,
  isExpanded,
  onToggleExpand,
  onDispatch,
  onDeliver,
  onEdit,
  onCancel,
}) => {
  const statusStyles = statusStyleMap[shipment.status] || statusStyleMap.CREATED;
  const machineCount = shipment.items?.length ?? 0;

  const destinationLabel = shipment.toWarehouse
    ? `${shipment.toWarehouse.name}, ${shipment.toWarehouse.city}`
    : shipment.toClient
      ? `${shipment.toClient.name}${shipment.toClient.city ? `, ${shipment.toClient.city}` : ''}`
      : 'Unknown';

  const sourceLabel = shipment.fromWarehouse
    ? `${shipment.fromWarehouse.name}, ${shipment.fromWarehouse.city}`
    : shipment.fromWarehouseId;

  const tracking = shipment.trackingId || shipment.id.slice(0, 8).toUpperCase();

  return (
    <Card onPress={onPress} variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingLabel}>Tracking #</Text>
          <Text style={styles.trackingNumber}>{tracking}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusStyles.backgroundColor }]}> 
          <Text style={[styles.statusText, { color: statusStyles.color }]}>{shipment.status}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, styles.originDot]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Origin</Text>
            <Text style={styles.routeValue}>{sourceLabel}</Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.routePoint}>
          <View style={[styles.routeDot, styles.destDot]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Destination</Text>
            <Text style={styles.routeValue}>{destinationLabel}</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.expandRow} onPress={onToggleExpand}>
        <Text style={styles.expandText}>{machineCount} Machines {isExpanded ? '▲' : '▼'}</Text>
      </Pressable>

      {isExpanded && (
        <View style={styles.machineList}>
          {(shipment.items || []).map((item) => (
            <View key={item.machine.id} style={styles.machineRow}>
              <Text style={styles.machineSerial}>{item.machine.serialNumber}</Text>
              <Text style={styles.machineModel}>{item.machine.model}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.metaRow}>
        <View style={styles.footerItem}>
          <Icon name="calendar-clock" size={16} color={Colors.textSecondary} />
          <Text style={styles.footerText}>ETA: {formatDate(shipment.expectedDeliveryDate)}</Text>
        </View>
        <View style={styles.footerItem}>
          <Icon name="clock-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.footerText}>Created: {formatDate(shipment.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        {shipment.status === 'CREATED' && (
          <Pressable style={styles.actionButton} onPress={onDispatch}>
            <Text style={styles.actionButtonText}>Dispatch</Text>
          </Pressable>
        )}
        {shipment.status === 'IN_TRANSIT' && (
          <Pressable style={[styles.actionButton, styles.actionDeliver]} onPress={onDeliver}>
            <Text style={styles.actionButtonText}>Mark Delivered</Text>
          </Pressable>
        )}
        {(shipment.status === 'CREATED' || shipment.status === 'IN_TRANSIT') && (
          <Pressable style={[styles.actionButton, styles.actionSecondary]} onPress={onEdit}>
            <Text style={styles.actionSecondaryText}>Edit</Text>
          </Pressable>
        )}
        {shipment.status !== 'DELIVERED' && shipment.status !== 'CANCELLED' && (
          <Pressable style={[styles.actionButton, styles.actionDanger]} onPress={onCancel}>
            <Text style={styles.actionButtonText}>Cancel</Text>
          </Pressable>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  trackingInfo: {},
  trackingLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    marginBottom: 2,
  },
  trackingNumber: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  statusPill: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  routeContainer: {
    marginBottom: Spacing.lg,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  originDot: {
    backgroundColor: Colors.secondary,
  },
  destDot: {
    backgroundColor: Colors.primary,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.border,
    marginLeft: 5,
    marginVertical: Spacing.xs,
  },
  routeInfo: {},
  routeLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
  },
  routeValue: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  expandRow: {
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expandText: {
    color: Colors.primary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  machineList: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  machineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundInput,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  machineSerial: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  machineModel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginLeft: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  actionDeliver: {
    backgroundColor: Colors.secondary,
  },
  actionSecondary: {
    backgroundColor: Colors.backgroundInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionDanger: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  actionSecondaryText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
});

export default ShipmentCard;
