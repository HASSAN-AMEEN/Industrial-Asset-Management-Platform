import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { Header, Card, StatusBadge, Button } from '../components';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Machine } from '../types';

// Sample machine data
const sampleMachine: Machine = {
  id: '1',
  serialNumber: 'M-4521',
  model: 'Industrial Pump X200',
  type: 'Pump',
  status: 'active',
  location: 'Houston, TX',
  lastService: 'Feb 15, 2024',
  nextService: 'May 15, 2024',
  healthScore: 92,
  operator: 'John Smith',
  installDate: 'Jan 10, 2023',
};

const statusHistory = [
  { status: 'Active', date: 'Mar 01, 2024', description: 'Returned to service' },
  { status: 'Maintenance', date: 'Feb 25, 2024', description: 'Scheduled maintenance completed' },
  { status: 'Active', date: 'Jan 15, 2024', description: 'Installation verified' },
  { status: 'Transit', date: 'Jan 10, 2024', description: 'Delivered to site' },
];

interface MachineDetailScreenProps {
  machineId?: string;
  onBackPress?: () => void;
  onEditPress?: () => void;
}

export const MachineDetailScreen: React.FC<MachineDetailScreenProps> = ({
  machineId,
  onBackPress,
  onEditPress,
}) => {
  const machine = sampleMachine;

  const getHealthColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 50) return Colors.warning;
    return Colors.error;
  };

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Icon name={icon} size={18} color={Colors.textSecondary} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Machine Details"
        showBack
        onBackPress={onBackPress}
        rightIcon="pencil"
        onRightPress={onEditPress}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Card variant="elevated" style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.machineIcon}>
              <Icon name="cog" size={32} color={Colors.primary} />
            </View>
            <StatusBadge status={machine.status} size="md" />
          </View>
          <Text style={styles.serialNumber}>{machine.serialNumber}</Text>
          <Text style={styles.model}>{machine.model}</Text>

          {/* Health Score */}
          <View style={styles.healthSection}>
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

        {/* Details Card */}
        <Card variant="elevated" style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Machine Information</Text>
          <View style={styles.infoGrid}>
            <InfoRow icon="tag" label="Type" value={machine.type} />
            <InfoRow icon="map-marker" label="Location" value={machine.location} />
            <InfoRow icon="account" label="Operator" value={machine.operator || 'Unassigned'} />
            <InfoRow icon="calendar" label="Installed" value={machine.installDate || 'N/A'} />
            <InfoRow icon="wrench" label="Last Service" value={machine.lastService} />
            <InfoRow icon="calendar-clock" label="Next Service" value={machine.nextService} />
          </View>
        </Card>

        {/* Status History */}
        <Card variant="elevated" style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Status History</Text>
          <View style={styles.timeline}>
            {statusHistory.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, index === 0 && styles.timelineDotActive]} />
                  {index < statusHistory.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineStatus}>{item.status}</Text>
                    <Text style={styles.timelineDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.timelineDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Schedule Maintenance"
            onPress={() => {}}
            variant="primary"
            leftIcon="wrench"
            fullWidth
          />
          <Button
            title="Create Shipment"
            onPress={() => {}}
            variant="outline"
            leftIcon="truck"
            fullWidth
            style={styles.secondaryButton}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  headerCard: {
    marginBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  machineIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serialNumber: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  model: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  healthSection: {
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  healthLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  healthValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  healthBarBg: {
    height: 8,
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  healthBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  detailsCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  infoGrid: {
    gap: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  historyCard: {
    marginBottom: Spacing.lg,
  },
  timeline: {},
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
  },
  timelineDotActive: {
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Spacing.lg,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  timelineStatus: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timelineDate: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  timelineDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  actions: {
    marginTop: Spacing.md,
  },
  secondaryButton: {
    marginTop: Spacing.md,
  },
  bottomPadding: {
    height: 40,
  },
});

export default MachineDetailScreen;
