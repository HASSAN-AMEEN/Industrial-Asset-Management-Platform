import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Card from './Card';
import StatusBadge from './StatusBadge';
import { Shipment } from '../types';

interface ShipmentCardProps {
  shipment: Shipment;
  onPress?: () => void;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({ shipment, onPress }) => {
  const statusMap = {
    pending: 'pending',
    in_transit: 'transit',
    delivered: 'delivered',
    delayed: 'delayed',
  } as const;

  const mappedStatus =
    statusMap[shipment.status as keyof typeof statusMap] || 'pending';

  return (
    <Card onPress={onPress} variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingLabel}>Tracking #</Text>
          <Text style={styles.trackingNumber}>{shipment.trackingNumber}</Text>
        </View>
        <StatusBadge status={mappedStatus} size="sm" />
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, styles.originDot]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Origin</Text>
            <Text style={styles.routeValue}>{shipment.origin}</Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.routePoint}>
          <View style={[styles.routeDot, styles.destDot]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Destination</Text>
            <Text style={styles.routeValue}>{shipment.destination}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Icon name="package-variant" size={16} color={Colors.textSecondary} />
          <Text style={styles.footerText}>{shipment.machineIds.length} machines</Text>
        </View>
        <View style={styles.footerItem}>
          <Icon name="calendar" size={16} color={Colors.textSecondary} />
          <Text style={styles.footerText}>ETA: {shipment.estimatedArrival}</Text>
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
    fontSize: FontSizes.md,
    fontWeight: '600',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginLeft: Spacing.xs,
  },
});

export default ShipmentCard;
