import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { Header, SearchBar, Input, Button, Card, EmptyState, ErrorState, FAB, Skeleton } from '../components';
import { parseApiError, ParsedApiError } from '../utils/errors';
import { useAuth } from '../store/AuthContext';
import { useDrawer } from '../store/DrawerContext';
import warehouseService, { Warehouse, WarehouseManager, WarehouseInventory } from '../services/warehouse';

interface WarehouseFormState {
  name: string;
  address: string;
  city: string;
  capacity: string;
  managerId: string | null;
}

const emptyForm: WarehouseFormState = { name: '', address: '', city: '', capacity: '', managerId: null };

export const WarehouseManagementScreen: React.FC = () => {
  const { user } = useAuth();
  const { open: openDrawer } = useDrawer();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [managers, setManagers] = React.useState<WarehouseManager[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<ParsedApiError | null>(null);
  const [search, setSearch] = React.useState('');

  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [inventoryById, setInventoryById] = React.useState<Record<string, WarehouseInventory>>({});
  const [loadingInventoryId, setLoadingInventoryId] = React.useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<WarehouseFormState>(emptyForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      const [warehouseData, managerData] = await Promise.all([
        warehouseService.list(),
        // Managers list is admin-only; ignore failures for non-admins.
        isAdmin ? warehouseService.listManagers().catch(() => [] as WarehouseManager[]) : Promise.resolve([] as WarehouseManager[]),
      ]);
      setWarehouses(warehouseData);
      setManagers(managerData);
    } catch (error) {
      setErrorMessage(parseApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const managerForWarehouse = React.useCallback(
    (warehouseId: string): WarehouseManager | undefined => managers.find((m) => m.warehouseId === warehouseId),
    [managers]
  );

  const filteredWarehouses = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return warehouses;
    return warehouses.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.city.toLowerCase().includes(q) ||
        (w.address || '').toLowerCase().includes(q)
    );
  }, [warehouses, search]);

  const toggleExpand = async (warehouse: Warehouse) => {
    if (expandedId === warehouse.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(warehouse.id);
    if (!inventoryById[warehouse.id]) {
      setLoadingInventoryId(warehouse.id);
      try {
        const inv = await warehouseService.getInventory(warehouse.id);
        setInventoryById((prev) => ({ ...prev, [warehouse.id]: inv }));
      } catch {
        // ignore; card just won't show counts
      } finally {
        setLoadingInventoryId(null);
      }
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id);
    setForm({
      name: warehouse.name,
      address: warehouse.address,
      city: warehouse.city,
      capacity: warehouse.capacity != null ? String(warehouse.capacity) : '',
      managerId: managerForWarehouse(warehouse.id)?.id ?? null,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const address = form.address.trim();
    const city = form.city.trim();
    if (!name || !address || !city) {
      setFormError('Name, address, and city are required.');
      return;
    }
    const capacity = form.capacity.trim() ? Number(form.capacity.trim()) : undefined;
    if (capacity !== undefined && (Number.isNaN(capacity) || capacity < 0)) {
      setFormError('Capacity must be a positive number.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      const payload = { name, address, city, capacity };
      const saved = editingId
        ? await warehouseService.update(editingId, payload)
        : await warehouseService.create(payload);

      // Assign / reassign manager if one was chosen and it changed.
      const currentManagerId = managerForWarehouse(saved.id)?.id ?? null;
      if (form.managerId && form.managerId !== currentManagerId) {
        await warehouseService.assignManager(saved.id, form.managerId);
      }

      closeModal();
      await loadData();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save warehouse');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (warehouse: Warehouse) => {
    Alert.alert('Delete warehouse', `Delete "${warehouse.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await warehouseService.remove(warehouse.id);
            await loadData();
          } catch (error) {
            Alert.alert('Could not delete', error instanceof Error ? error.message : 'Failed to delete warehouse');
          }
        },
      },
    ]);
  };

  const renderWarehouse = ({ item }: { item: Warehouse }) => {
    const manager = managerForWarehouse(item.id);
    const isExpanded = expandedId === item.id;
    const inventory = inventoryById[item.id];

    return (
      <Card variant="elevated" style={styles.card}>
        <Pressable style={styles.cardHeader} onPress={() => toggleExpand(item)}>
          <View style={styles.warehouseIcon}>
            <Icon name="warehouse" size={22} color={Colors.primary} />
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.warehouseName}>{item.name}</Text>
            <Text style={styles.warehouseSub} numberOfLines={1}>
              {item.address}, {item.city}
            </Text>
          </View>
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={22} color={Colors.textMuted} />
        </Pressable>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Icon name="account-tie" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {manager ? manager.email.split('@')[0] : 'No manager'}
            </Text>
          </View>
          {!!manager?.contact && (
            <View style={styles.metaPill}>
              <Icon name="phone-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{manager.contact}</Text>
            </View>
          )}
          {item.capacity != null && (
            <View style={styles.metaPill}>
              <Icon name="cube-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>Cap {item.capacity}</Text>
            </View>
          )}
        </View>

        {isExpanded && (
          <View style={styles.expanded}>
            {loadingInventoryId === item.id && !inventory ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ paddingVertical: Spacing.md }} />
            ) : inventory ? (
              <>
                <View style={styles.inventoryRow}>
                  <Text style={styles.inventoryTotal}>{inventory.total}</Text>
                  <Text style={styles.inventoryLabel}>machines stored</Text>
                </View>
                {Object.keys(inventory.byStatus).length > 0 && (
                  <View style={styles.statusChips}>
                    {Object.entries(inventory.byStatus).map(([status, count]) => (
                      <View key={status} style={styles.statusChip}>
                        <Text style={styles.statusChipText}>
                          {status.replace(/_/g, ' ')}: {count}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.emptyInline}>No inventory data.</Text>
            )}

            {isAdmin && (
              <View style={styles.cardActions}>
                <Button title="Edit" size="sm" variant="outline" leftIcon="pencil" onPress={() => openEdit(item)} style={styles.cardActionBtn} />
                <Button title="Delete" size="sm" variant="outline" leftIcon="trash-can-outline" onPress={() => handleDelete(item)} style={styles.cardActionBtn} />
              </View>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Warehouses"
        subtitle={`${warehouses.length} ${warehouses.length === 1 ? 'warehouse' : 'warehouses'}`}
        showMenu
        onMenuPress={openDrawer}
      />

      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name, city or address" showFilter={false} />
      </View>

      {errorMessage && (
        <ErrorState
          error={errorMessage}
          variant="inline"
          onRetry={loadData}
          style={styles.errorBox}
        />
      )}

      {isLoading ? (
        <View style={styles.listContent}>
          {[0, 1, 2].map((i) => (
            <Card key={i} variant="elevated" style={styles.card}>
              <View style={styles.cardHeader}>
                <Skeleton width={44} height={44} radius={BorderRadius.md} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Skeleton width={'60%'} height={14} />
                  <Skeleton width={'80%'} height={12} style={{ marginTop: Spacing.sm }} />
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredWarehouses}
          keyExtractor={(item) => item.id}
          renderItem={renderWarehouse}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="warehouse"
              title="No warehouses found"
              description={isAdmin ? 'Tap + to add your first warehouse.' : 'No warehouses to show.'}
            />
          }
        />
      )}

      {isAdmin && <FAB icon="plus" onPress={openCreate} style={styles.fab} />}

      {/* Create / Edit modal */}
      <Modal visible={isModalOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <Card variant="elevated" style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>{editingId ? 'Edit Warehouse' : 'New Warehouse'}</Text>

              <Input label="Name *" placeholder="e.g. Main Warehouse" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
              <Input label="Address *" placeholder="Street / area" value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} />
              <Input label="City *" placeholder="City" value={form.city} onChangeText={(v) => setForm((f) => ({ ...f, city: v }))} />
              <Input
                label="Capacity"
                placeholder="Optional"
                value={form.capacity}
                onChangeText={(v) => setForm((f) => ({ ...f, capacity: v }))}
                keyboardType="number-pad"
              />

              <Text style={styles.fieldLabel}>Assign Manager (optional)</Text>
              <Text style={styles.helperText}>
                Create manager accounts in User Management (menu → User Management), then assign one here.
              </Text>
              <View style={styles.managerList}>
                <Pressable
                  style={[styles.managerOption, !form.managerId && styles.managerOptionSelected]}
                  onPress={() => setForm((f) => ({ ...f, managerId: null }))}
                >
                  <Icon name={!form.managerId ? 'radiobox-marked' : 'radiobox-blank'} size={18} color={!form.managerId ? Colors.primary : Colors.textMuted} />
                  <Text style={styles.managerOptionText}>No manager</Text>
                </Pressable>
                {managers.map((m) => {
                  const selected = form.managerId === m.id;
                  const assignedElsewhere = !!m.warehouseId && m.warehouseId !== editingId;
                  return (
                    <Pressable
                      key={m.id}
                      style={[styles.managerOption, selected && styles.managerOptionSelected]}
                      onPress={() => setForm((f) => ({ ...f, managerId: m.id }))}
                    >
                      <Icon name={selected ? 'radiobox-marked' : 'radiobox-blank'} size={18} color={selected ? Colors.primary : Colors.textMuted} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.managerOptionText}>
                          {m.email}
                          {m.contact ? <Text style={styles.managerContact}>  ·  {m.contact}</Text> : null}
                        </Text>
                        {assignedElsewhere && <Text style={styles.managerAssigned}>currently assigned to another warehouse</Text>}
                      </View>
                    </Pressable>
                  );
                })}
                {managers.length === 0 && <Text style={styles.helperText}>No warehouse managers yet.</Text>}
              </View>

              {!!formError && <Text style={styles.formError}>{formError}</Text>}

              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={closeModal} style={styles.modalButton} />
                <Button title={isSaving ? 'Saving...' : editingId ? 'Save' : 'Create'} onPress={handleSave} disabled={isSaving} style={styles.modalButton} />
              </View>
            </ScrollView>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchContainer: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  card: { marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  warehouseIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderInfo: { flex: 1, marginLeft: Spacing.md },
  warehouseName: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: '600' },
  warehouseSub: { color: Colors.textSecondary, fontSize: FontSizes.xs, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundInput,
  },
  metaText: { color: Colors.textSecondary, fontSize: FontSizes.xs, fontWeight: '500', maxWidth: 160 },
  expanded: { marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  inventoryRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  inventoryTotal: { color: Colors.textPrimary, fontSize: FontSizes.xxl, fontWeight: '700' },
  inventoryLabel: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  statusChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  statusChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundElevated,
  },
  statusChipText: { color: Colors.textSecondary, fontSize: FontSizes.xs },
  emptyInline: { color: Colors.textMuted, fontSize: FontSizes.sm },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cardActionBtn: { flex: 1 },
  fab: { position: 'absolute', bottom: Spacing.xl, right: Spacing.lg },
  errorBox: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.error}15`,
    borderWidth: 1,
    borderColor: `${Colors.error}40`,
    gap: Spacing.sm,
  },
  errorText: { color: Colors.error, fontSize: FontSizes.sm },
  modalBackdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', paddingHorizontal: Spacing.lg },
  modalCard: { maxHeight: '88%', padding: Spacing.lg },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  fieldLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.sm },
  helperText: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: Spacing.xs, marginBottom: Spacing.sm, lineHeight: 16 },
  managerList: { gap: Spacing.xs },
  managerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
  },
  managerOptionSelected: { backgroundColor: `${Colors.primary}12` },
  managerOptionText: { fontSize: FontSizes.sm, color: Colors.textPrimary },
  managerContact: { color: Colors.textMuted, fontSize: FontSizes.xs },
  managerAssigned: { color: Colors.warning, fontSize: FontSizes.xs, marginTop: 2 },
  formError: { color: Colors.error, fontSize: FontSizes.sm, marginTop: Spacing.md },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  modalButton: { flex: 1 },
});

export default WarehouseManagementScreen;
