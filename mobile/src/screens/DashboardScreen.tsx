import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { Card, StatCard, ActivityItem, Button } from '../components';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useResponsive } from '../hooks/useResponsive';
import { Activity } from '../types';

// Sample data
const stats = [
  { title: 'Total Machines', value: 247, icon: 'cog', color: Colors.primary, trend: { value: 12, isPositive: true } },
  { title: 'Active', value: 198, icon: 'check-circle', color: Colors.success },
  { title: 'In Transit', value: 23, icon: 'truck', color: Colors.secondary },
  { title: 'Maintenance', value: 26, icon: 'wrench', color: Colors.warning },
];

const fleetStatus = [
  { label: 'Active', value: 198, color: Colors.success, percentage: 80 },
  { label: 'Transit', value: 23, color: Colors.secondary, percentage: 9 },
  { label: 'Maintenance', value: 26, color: Colors.warning, percentage: 11 },
];

const recentActivity: Activity[] = [
  { id: '1', type: 'shipment', title: 'Shipment Delivered', description: 'SHP-2024-001 arrived at Houston facility', timestamp: '2h ago' },
  { id: '2', type: 'maintenance', title: 'Maintenance Scheduled', description: 'M-4521 requires routine service', timestamp: '4h ago' },
  { id: '3', type: 'installation', title: 'Installation Complete', description: 'M-4519 successfully installed at Dallas site', timestamp: '6h ago' },
  { id: '4', type: 'alert', title: 'Health Alert', description: 'M-4498 health score dropped below 50%', timestamp: '8h ago' },
];

interface DashboardScreenProps {
  onNavigate?: (screen: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const { wp } = useResponsive();

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning</Text>
          <Text style={styles.userName}>John Operator</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton}>
            <Icon name="bell-outline" size={24} color={Colors.textPrimary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </Pressable>
          <Pressable style={styles.avatarButton}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>JO</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Stats Cards - Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        >
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.color}
              trend={stat.trend}
              style={{ width: wp(40), marginRight: Spacing.md }}
              size="sm"
            />
          ))}
        </ScrollView>

        {/* Fleet Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fleet Status</Text>
            <Pressable onPress={() => onNavigate?.('Machines')}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <Card variant="elevated">
            <View style={styles.fleetStatusContainer}>
              {/* Donut Chart Placeholder */}
              <View style={styles.chartContainer}>
                <View style={styles.donutChart}>
                  <View style={styles.donutCenter}>
                    <Text style={styles.donutValue}>247</Text>
                    <Text style={styles.donutLabel}>Total</Text>
                  </View>
                </View>
              </View>
              {/* Legend */}
              <View style={styles.legendContainer}>
                {fleetStatus.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{item.label}</Text>
                    <Text style={styles.legendValue}>{item.value}</Text>
                    <Text style={styles.legendPercentage}>{item.percentage}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable
              style={styles.quickActionItem}
              onPress={() => onNavigate?.('AddMachine')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.primary}20` }]}>
                <Icon name="plus" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Add Machine</Text>
            </Pressable>
            <Pressable
              style={styles.quickActionItem}
              onPress={() => onNavigate?.('Shipments')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.secondary}20` }]}>
                <Icon name="truck" size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.quickActionLabel}>New Shipment</Text>
            </Pressable>
            <Pressable
              style={styles.quickActionItem}
              onPress={() => onNavigate?.('Map')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.accent}20` }]}>
                <Icon name="map-marker" size={24} color={Colors.accent} />
              </View>
              <Text style={styles.quickActionLabel}>View Map</Text>
            </Pressable>
            <Pressable
              style={styles.quickActionItem}
              onPress={() => onNavigate?.('Reports')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.info}20` }]}>
                <Icon name="chart-bar" size={24} color={Colors.info} />
              </View>
              <Text style={styles.quickActionLabel}>Reports</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Pressable>
              <Text style={styles.seeAll}>View All</Text>
            </Pressable>
          </View>
          {recentActivity.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerButton: {
    position: 'relative',
    padding: Spacing.xs,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
  },
  statsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  fleetStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartContainer: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
  },
  donutChart: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    borderWidth: 12,
    borderColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    alignItems: 'center',
  },
  donutValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  donutLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  legendContainer: {
    flex: 1,
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  legendLabel: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  legendValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
    minWidth: 30,
    textAlign: 'right',
  },
  legendPercentage: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    minWidth: 35,
    textAlign: 'right',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickActionItem: {
    width: '47%',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
});

export default DashboardScreen;
