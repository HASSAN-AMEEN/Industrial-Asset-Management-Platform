import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { ActivityItem, Card, ErrorState, Skeleton } from '../components';
import { parseApiError, ParsedApiError } from '../utils/errors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useResponsive } from '../hooks/useResponsive';
import { Activity } from '../types';
import { useAuth } from '../store/AuthContext';
import { useDrawer } from '../store/DrawerContext';
import dashboardService, { DashboardPayload } from '../services/dashboard';
import notificationsService from '../services/notifications';

// Visual config for each machine status (label, colour, icon).
const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  IN_WAREHOUSE: { label: 'In Warehouse', color: Colors.info, icon: 'warehouse' },
  RESERVED: { label: 'Reserved', color: Colors.accent, icon: 'bookmark-outline' },
  UNDER_SHIPMENT: { label: 'Under Shipment', color: Colors.secondary, icon: 'truck-outline' },
  DELIVERED: { label: 'Delivered', color: Colors.primaryLight, icon: 'package-variant-closed' },
  INSTALLED: { label: 'Installed', color: Colors.success, icon: 'check-decagram' },
  UNDER_MAINTENANCE: { label: 'Maintenance', color: Colors.warning, icon: 'wrench-outline' },
  RETURNED: { label: 'Returned', color: Colors.error, icon: 'undo-variant' },
};

const formatRelativeTime = (isoDate: string): string => {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return 'just now';
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
  if (!email) return 'Operator';
  const localPart = email.split('@')[0] || '';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'Operator';
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
};

/** Animated count-up number — eases from 0 to the target whenever it changes. */
const CountUp: React.FC<{ value: number; style?: any }> = ({ value, style }) => {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    let raf: number;
    const duration = 800;
    const start = Date.now();
    const from = 0;
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <Text style={style}>{display}</Text>;
};

/** Horizontal bar whose fill width animates in. */
const AnimatedBar: React.FC<{ percentage: number; color: string }> = ({ percentage, color }) => {
  const widthAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.max(0, Math.min(percentage, 100)),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [percentage, widthAnim]);

  const width = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { width, backgroundColor: color }]} />
    </View>
  );
};

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<ParsedApiError | null>(null);
  const [dashboardData, setDashboardData] = React.useState<DashboardPayload | null>(null);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const { wp } = useResponsive();
  const { user } = useAuth();
  const { open: openDrawer } = useDrawer();

  const contentAnim = React.useRef(new Animated.Value(0)).current;

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoadError(null);
      const [dashboardResult, notificationsResult] = await Promise.allSettled([
        dashboardService.getDashboard(),
        notificationsService.getUnreadCount(),
      ]);

      if (dashboardResult.status === 'fulfilled') {
        setDashboardData(dashboardResult.value);
      } else {
        setLoadError(parseApiError(dashboardResult.reason));
      }

      if (notificationsResult.status === 'fulfilled') {
        setNotificationCount(notificationsResult.value.unreadCount);
      }
    } catch (error) {
      setLoadError(parseApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fade + lift the content in once the first load resolves.
  React.useEffect(() => {
    if (!isLoading && dashboardData) {
      Animated.timing(contentAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    }
  }, [contentAnim, dashboardData, isLoading]);

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'WAREHOUSE_MANAGER';
  const canSeeMachines = user?.role !== 'TECHNICIAN';
  const canSeeShipments = user?.role !== 'TECHNICIAN';

  const statCards = React.useMemo(() => {
    const m = dashboardData?.machineStats;
    return [
      { title: 'Total Machines', value: m?.total ?? 0, icon: 'cog', color: Colors.primary },
      { title: 'Installations', value: dashboardData?.installationsCount ?? 0, icon: 'map-marker-check', color: Colors.success },
      { title: 'In Transit', value: dashboardData?.shipmentsInTransit ?? 0, icon: 'truck-fast', color: Colors.secondary },
      { title: 'Maintenance', value: m?.maintenance ?? 0, icon: 'wrench', color: Colors.warning },
    ];
  }, [dashboardData]);

  const statusBreakdown = dashboardData?.statusBreakdown ?? [];
  const warehouses = dashboardData?.machinesPerWarehouse ?? [];
  const maxWarehouseCount = warehouses.reduce((max, w) => Math.max(max, w.count), 0) || 1;

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

  const quickActions = React.useMemo(() => {
    const actions: { label: string; icon: string; color: string; onPress: () => void }[] = [];
    if (canManage) {
      actions.push({ label: 'Add Machine', icon: 'plus', color: Colors.primary, onPress: () => navigation.navigate('AddMachine') });
    } else if (canSeeMachines) {
      actions.push({ label: 'Machines', icon: 'cog', color: Colors.primary, onPress: () => navigation.navigate('Machines') });
    }
    if (canSeeShipments) {
      actions.push({ label: 'Shipments', icon: 'truck', color: Colors.secondary, onPress: () => navigation.navigate('Shipments') });
    }
    actions.push({ label: 'View Map', icon: 'map-marker', color: Colors.accent, onPress: () => navigation.navigate('Map') });
    actions.push({ label: 'Training', icon: 'school', color: Colors.info, onPress: () => navigation.navigate('Training') });
    return actions;
  }, [canManage, canSeeMachines, canSeeShipments, navigation]);

  const showSkeleton = isLoading && !dashboardData;

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
          <Pressable style={styles.headerButton} onPress={openDrawer} hitSlop={8}>
            <Icon name="menu" size={26} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        {loadError && (
          <View style={styles.section}>
            <ErrorState
              error={loadError}
              variant="inline"
              onRetry={fetchDashboardData}
            />
          </View>
        )}

        {/* Stat cards */}
        {showSkeleton ? (
          <View style={styles.statsSkeletonRow}>
            {[0, 1, 2].map((i) => (
              <Card key={i} variant="elevated" style={{ width: wp(40), marginRight: Spacing.md }}>
                <Skeleton width={36} height={36} radius={BorderRadius.md} />
                <Skeleton width={56} height={24} style={{ marginTop: Spacing.md }} />
                <Skeleton width={80} height={12} style={{ marginTop: Spacing.sm }} />
              </Card>
            ))}
          </View>
        ) : (
          <Animated.View style={{ opacity: contentAnim }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContainer}>
              {statCards.map((stat) => (
                <Card
                  key={stat.title}
                  variant="elevated"
                  style={{ width: wp(40), marginRight: Spacing.md, padding: Spacing.md }}
                >
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                    <Icon name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <CountUp value={stat.value} style={styles.statValue} />
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </Card>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Machines by Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Machines by Status</Text>
            {canSeeMachines && (
              <Pressable onPress={() => navigation.navigate('Machines')}>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            )}
          </View>
          <Card variant="elevated">
            {showSkeleton ? (
              [0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.statusRow}>
                  <Skeleton width={110} height={14} />
                  <Skeleton width={'40%'} height={8} style={{ marginLeft: Spacing.md, flex: 1 }} />
                </View>
              ))
            ) : statusBreakdown.length === 0 ? (
              <Text style={styles.emptyText}>No machines yet.</Text>
            ) : (
              <Animated.View style={{ opacity: contentAnim }}>
                {statusBreakdown.map((item) => {
                  const meta = STATUS_META[item.status] || { label: item.status, color: Colors.textMuted, icon: 'cog' };
                  return (
                    <View key={item.status} style={styles.statusRow}>
                      <View style={styles.statusLabelGroup}>
                        <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                        <Text style={styles.statusLabel}>{meta.label}</Text>
                      </View>
                      <View style={styles.statusBarGroup}>
                        <AnimatedBar percentage={item.percentage} color={meta.color} />
                      </View>
                      <Text style={styles.statusCount}>{item.count}</Text>
                    </View>
                  );
                })}
              </Animated.View>
            )}
          </Card>
        </View>

        {/* Machines per Warehouse */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Machines per Warehouse</Text>
          </View>
          <Card variant="elevated">
            {showSkeleton ? (
              [0, 1].map((i) => (
                <View key={i} style={styles.statusRow}>
                  <Skeleton width={120} height={14} />
                  <Skeleton width={'30%'} height={8} style={{ marginLeft: Spacing.md, flex: 1 }} />
                </View>
              ))
            ) : warehouses.length === 0 ? (
              <Text style={styles.emptyText}>No warehouses with machines yet.</Text>
            ) : (
              <Animated.View style={{ opacity: contentAnim }}>
                {warehouses.map((warehouse, index) => (
                  <View key={warehouse.warehouseId} style={styles.statusRow}>
                    <View style={styles.statusLabelGroup}>
                      <Icon name="warehouse" size={14} color={Colors.textSecondary} style={{ marginRight: Spacing.sm }} />
                      <Text style={styles.statusLabel} numberOfLines={1}>
                        {warehouse.warehouseName}
                      </Text>
                    </View>
                    <View style={styles.statusBarGroup}>
                      <AnimatedBar
                        percentage={(warehouse.count / maxWarehouseCount) * 100}
                        color={index === 0 ? Colors.primary : Colors.secondary}
                      />
                    </View>
                    <Text style={styles.statusCount}>{warehouse.count}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <Pressable key={action.label} style={styles.quickActionItem} onPress={action.onPress}>
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                  <Icon name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          {showSkeleton ? (
            [0, 1, 2].map((i) => (
              <View key={i} style={styles.activitySkeletonRow}>
                <Skeleton width={40} height={40} radius={BorderRadius.full} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Skeleton width={'70%'} height={14} />
                  <Skeleton width={'45%'} height={12} style={{ marginTop: Spacing.sm }} />
                </View>
              </View>
            ))
          ) : recentActivity.length === 0 ? (
            <Text style={styles.emptyText}>No recent activity yet.</Text>
          ) : (
            <Animated.View style={{ opacity: contentAnim }}>
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </Animated.View>
          )}
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
  statsSkeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statTitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statusLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 130,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  statusLabel: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  statusBarGroup: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  barTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundInput,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  statusCount: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 28,
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
  activitySkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  bottomPadding: {
    height: 100,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    paddingVertical: Spacing.sm,
  },
});

export default DashboardScreen;
