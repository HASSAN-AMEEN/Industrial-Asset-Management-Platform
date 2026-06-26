import React from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { Header, Card, StatusBadge, Button, Skeleton } from '../components';
import machineService, { BackendMachine, BackendMachineStatus, MachineHistoryEntry } from '../services/machine';

const STATUS_META: Record<string, { label: string; color: string }> = {
  IN_WAREHOUSE: { label: 'In Warehouse', color: Colors.info },
  RESERVED: { label: 'Reserved', color: Colors.accent },
  UNDER_SHIPMENT: { label: 'Under Shipment', color: Colors.secondary },
  DELIVERED: { label: 'Delivered', color: Colors.primaryLight },
  INSTALLED: { label: 'Installed', color: Colors.success },
  UNDER_MAINTENANCE: { label: 'Maintenance', color: Colors.warning },
  RETURNED: { label: 'Returned', color: Colors.error },
  SYSTEM: { label: 'System', color: Colors.textMuted },
};

const statusLabel = (status: string): string => STATUS_META[status]?.label ?? status;
const statusColor = (status: string): string => STATUS_META[status]?.color ?? Colors.textMuted;

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatCost = (cost?: string | number | null): string => {
  if (cost === null || cost === undefined || cost === '') return '—';
  const n = typeof cost === 'string' ? Number(cost) : cost;
  if (Number.isNaN(n)) return String(cost);
  return n.toLocaleString('en-US', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });
};

const InfoRow: React.FC<{ icon: string; label: string; value?: string | null }> = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={18} color={Colors.textSecondary} />
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  </View>
);

export const MachineDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const machineId: string | undefined = route.params?.id;

  const [machine, setMachine] = React.useState<BackendMachine | null>(null);
  const [history, setHistory] = React.useState<MachineHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!machineId) {
      setErrorMessage('No machine selected');
      setIsLoading(false);
      return;
    }
    try {
      setErrorMessage(null);
      const [machineData, historyData] = await Promise.all([
        machineService.getById(machineId),
        machineService.history(machineId).catch(() => [] as MachineHistoryEntry[]),
      ]);
      setMachine(machineData);
      setHistory(historyData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load machine');
    } finally {
      setIsLoading(false);
    }
  }, [machineId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const installSite = machine?.installation?.siteAddress;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Machine Details" showBack onBackPress={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {errorMessage && (
          <Card variant="outlined" style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Button title="Retry" size="sm" onPress={load} />
          </Card>
        )}

        {isLoading ? (
          <>
            <Card variant="elevated" style={styles.headerCard}>
              <Skeleton width={64} height={64} radius={BorderRadius.lg} />
              <Skeleton width={'60%'} height={22} style={{ marginTop: Spacing.md }} />
              <Skeleton width={'40%'} height={14} style={{ marginTop: Spacing.sm }} />
            </Card>
            <Card variant="elevated" style={styles.detailsCard}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} width={'80%'} height={16} style={{ marginBottom: Spacing.lg }} />
              ))}
            </Card>
          </>
        ) : machine ? (
          <>
            {/* Header card */}
            <Card variant="elevated" style={styles.headerCard}>
              <View style={styles.headerTop}>
                <View style={styles.machineIcon}>
                  <Icon name="cog" size={32} color={Colors.primary} />
                </View>
                <StatusBadge status={machine.status} size="md" />
              </View>
              <Text style={styles.serialNumber}>{machine.serialNumber}</Text>
              <Text style={styles.model}>{machine.model}</Text>
            </Card>

            {/* Info */}
            <Card variant="elevated" style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Machine Information</Text>
              <View style={styles.infoGrid}>
                <InfoRow icon="tag-outline" label="Category" value={machine.category} />
                <InfoRow icon="warehouse" label="Warehouse" value={machine.warehouse?.name} />
                <InfoRow icon="account-outline" label="Client" value={machine.client?.name} />
                {machine.status === 'INSTALLED' && (
                  <InfoRow icon="map-marker-outline" label="Installation Site" value={installSite} />
                )}
                <InfoRow icon="calendar-outline" label="Purchase Date" value={formatDate(machine.purchaseDate)} />
                <InfoRow icon="cash" label="Cost" value={formatCost(machine.cost)} />
                <InfoRow icon="clock-outline" label="Added" value={formatDate(machine.createdAt)} />
              </View>
            </Card>

            {/* Status history */}
            <Card variant="elevated" style={styles.historyCard}>
              <Text style={styles.sectionTitle}>Status History</Text>
              {history.length === 0 ? (
                <Text style={styles.emptyText}>No status changes recorded yet.</Text>
              ) : (
                <View style={styles.timeline}>
                  {history.map((entry, index) => (
                    <View key={entry.id} style={styles.timelineItem}>
                      <View style={styles.timelineLeft}>
                        <View style={[styles.timelineDot, { backgroundColor: statusColor(entry.toStatus) }]} />
                        {index < history.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text style={styles.timelineStatus}>
                            {statusLabel(entry.fromStatus)} → {statusLabel(entry.toStatus)}
                          </Text>
                        </View>
                        <Text style={styles.timelineMeta}>
                          {formatDateTime(entry.createdAt)} · {entry.changedByName || 'System'}
                        </Text>
                        {!!entry.comment && <Text style={styles.timelineComment}>{entry.comment}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </>
        ) : null}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.lg },
  errorCard: { marginBottom: Spacing.lg, gap: Spacing.sm },
  errorText: { color: Colors.error, fontSize: FontSizes.sm },
  headerCard: { marginBottom: Spacing.lg },
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
  serialNumber: { fontSize: FontSizes.xxl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  model: { fontSize: FontSizes.md, color: Colors.textSecondary },
  detailsCard: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.lg },
  infoGrid: { gap: Spacing.lg },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoContent: { marginLeft: Spacing.md, flex: 1 },
  infoLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: FontSizes.md, color: Colors.textPrimary, fontWeight: '500' },
  historyCard: { marginBottom: Spacing.lg },
  emptyText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  timeline: {},
  timelineItem: { flexDirection: 'row' },
  timelineLeft: { alignItems: 'center', marginRight: Spacing.md },
  timelineDot: { width: 12, height: 12, borderRadius: BorderRadius.full },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  timelineContent: { flex: 1, paddingBottom: Spacing.lg },
  timelineHeader: { marginBottom: 2 },
  timelineStatus: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textPrimary },
  timelineMeta: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  timelineComment: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  bottomPadding: { height: 40 },
});

export default MachineDetailScreen;
