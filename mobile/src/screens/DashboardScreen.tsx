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
import { useAuth } from '../store/AuthContext';
import dashboardService, { DashboardPayload } from '../services/dashboard';
import notificationsService from '../services/notifications';

const FLEET_COLOR_MAP: Record<'Active' | 'Transit' | 'Maintenance', string> = {
  Active: Colors.success,
  Transit: Colors.secondary,
  Maintenance: Colors.warning,
};

const formatRelativeTime = (isoDate: string): string => {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    return 'just now';
  }

  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const toDisplayName = (email?: string): string => {
  if (!email) {
    return 'Operator';
  }

  const localPart = email.split('@')[0] || '';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) {
    return 'Operator';
  }

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
};

interface DashboardScreenProps {
  onNavigate?: (screen: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [dashboardData, setDashboardData] = React.useState<DashboardPayload | null>(null);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const { wp } = useResponsive();
  const { logout, user } = useAuth();

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      const [dashboardResult, notificationsResult] = await Promise.allSettled([
        dashboardService.getDashboard(),
        notificationsService.getUnreadCount(),
      ]);

      if (dashboardResult.status === 'fulfilled') {
        setDashboardData(dashboardResult.value);
      } else {
        const message =
          dashboardResult.reason instanceof Error
            ? dashboardResult.reason.message
            : 'Failed to load dashboard';
        setErrorMessage(message);
      }

      if (notificationsResult.status === 'fulfilled') {
        setNotificationCount(notificationsResult.value.unreadCount);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load dashboard';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = React.useMemo(() => {
    const machineStats = dashboardData?.machineStats;
    return [
      { title: 'Total Machines', value: machineStats?.total ?? 0, icon: 'cog', color: Colors.primary },
      { title: 'Active', value: machineStats?.active ?? 0, icon: 'check-circle', color: Colors.success },
      { title: 'In Transit', value: machineStats?.inTransit ?? 0, icon: 'truck', color: Colors.secondary },
      { title: 'Maintenance', value: machineStats?.maintenance ?? 0, icon: 'wrench', color: Colors.warning },
    ];
  }, [dashboardData]);

  const fleetStatus = React.useMemo(() => {
    return (dashboardData?.fleetStatus ?? []).map((item) => ({
      ...item,
      color: FLEET_COLOR_MAP[item.label],
    }));
  }, [dashboardData]);

  const recentActivity: Activity[] = React.useMemo(() => {
    return (dashboardData?.recentActivity ?? []).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      timestamp: formatRelativeTime(item.createdAt),
    }));
  }, [dashboardData]);

  const greeting = React.useMemo(() => getGreeting(), []);
  const displayName = React.useMemo(() => toDisplayName(user?.email), [user?.email]);
  const badgeText = notificationCount > 99 ? '99+' : String(notificationCount);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>{displayName}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton}>
            <Icon name="bell-outline" size={24} color={Colors.textPrimary} />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>{badgeText}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={styles.avatarButton} onPress={() => logout()}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.email ? user.email.split('@')[0].slice(0,2).toUpperCase() : 'JO'}</Text>
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
        {errorMessage && (
          <View style={styles.section}>
            <Card variant="outlined">
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Button title="Retry" onPress={fetchDashboardData} size="sm" />
            </Card>
          </View>
        )}

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
              trend={undefined}
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
                    <Text style={styles.donutValue}>{dashboardData?.machineStats.total ?? 0}</Text>
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
          {isLoading && recentActivity.length === 0 && (
            <Text style={styles.loadingText}>Loading dashboard data...</Text>
          )}
          {!isLoading && recentActivity.length === 0 && (
            <Text style={styles.emptyText}>No recent activity yet.</Text>
          )}
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
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
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
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
  },
});

export default DashboardScreen;
