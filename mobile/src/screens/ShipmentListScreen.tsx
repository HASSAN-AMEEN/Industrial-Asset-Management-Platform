import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Text,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { Header, SearchBar, ShipmentCard, FAB, EmptyState, Input, Button } from '../components';
import { useAuth } from '../store/AuthContext';
import shipmentService, {
  BackendShipment,
  CreateShipmentInput,
  ShipmentHistoryEntry,
} from '../services/shipment';
import warehouseService, { Warehouse } from '../services/warehouse';
import machineService, { BackendMachine } from '../services/machine';
import clientService, { BackendClient } from '../services/client';

type TabType = 'all' | 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
type DestinationType = 'warehouse' | 'client';
type ModalMode = 'create' | 'edit';

const tabs: { key: TabType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'CREATED', label: 'Created' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

type ShipmentFormState = {
  fromWarehouseId: string;
  destinationType: DestinationType;
  toWarehouseId: string;
  toClientId: string;
  createNewClient: boolean;
  clientName: string;
  clientContact: string;
  clientAddress: string;
  clientCity: string;
  clientCountry: string;
  expectedDeliveryDate: string;
  notes: string;
  machineIds: string[];
};

const createEmptyForm = (): ShipmentFormState => ({
  fromWarehouseId: '',
  destinationType: 'warehouse',
  toWarehouseId: '',
  toClientId: '',
  createNewClient: false,
  clientName: '',
  clientContact: '',
  clientAddress: '',
  clientCity: '',
  clientCountry: '',
  expectedDeliveryDate: '',
  notes: '',
  machineIds: [],
});

const formatDate = (value?: string | Date | null): string => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatDateTime = (value?: string | Date | null): string => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isSelectableMachineStatus = (status: string): boolean =>
  status === 'IN_WAREHOUSE' || status === 'RESERVED';

interface ShipmentListScreenProps {
  onBackPress?: () => void;
}

export const ShipmentListScreen: React.FC<ShipmentListScreenProps> = ({ onBackPress }) => {
  const { user } = useAuth();

  const [shipments, setShipments] = React.useState<BackendShipment[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [clients, setClients] = React.useState<BackendClient[]>([]);
  const [sourceMachines, setSourceMachines] = React.useState<BackendMachine[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoadingMachines, setIsLoadingMachines] = React.useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);

  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<TabType>('all');
  const [expandedIds, setExpandedIds] = React.useState<Record<string, boolean>>({});

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<ModalMode>('create');
  const [editingShipment, setEditingShipment] = React.useState<BackendShipment | null>(null);
  const [form, setForm] = React.useState<ShipmentFormState>(createEmptyForm());

  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [detailShipment, setDetailShipment] = React.useState<BackendShipment | null>(null);
  const [history, setHistory] = React.useState<ShipmentHistoryEntry[]>([]);

  const loadData = React.useCallback(async () => {
    try {
      const [shipmentData, warehouseData, clientData] = await Promise.all([
        shipmentService.list(),
        warehouseService.list(),
        clientService.list(),
      ]);
      setShipments(shipmentData);
      setWarehouses(warehouseData);
      setClients(clientData);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load shipments');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    if (!isFormOpen || !form.fromWarehouseId) {
      setSourceMachines([]);
      return;
    }

    setIsLoadingMachines(true);
    machineService
      .list({ warehouseId: form.fromWarehouseId })
      .then((machines) => {
        setSourceMachines(machines.filter((machine) => isSelectableMachineStatus(machine.status)));
      })
      .catch(() => setSourceMachines([]))
      .finally(() => setIsLoadingMachines(false));
  }, [form.fromWarehouseId, isFormOpen]);

  React.useEffect(() => {
    if (!isFormOpen || formMode !== 'create') return;

    if (user?.role === 'WAREHOUSE_MANAGER' && user.warehouseId) {
      setForm((prev) => ({ ...prev, fromWarehouseId: user.warehouseId || '' }));
    }
  }, [formMode, isFormOpen, user?.role, user?.warehouseId]);

  const refresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const openCreate = () => {
    setFormMode('create');
    setEditingShipment(null);
    const initial = createEmptyForm();
    if (user?.role === 'WAREHOUSE_MANAGER' && user.warehouseId) {
      initial.fromWarehouseId = user.warehouseId;
    }
    setForm(initial);
    setIsFormOpen(true);
  };

  const openEdit = (shipment: BackendShipment) => {
    const isClient = !!shipment.toClientId;

    setFormMode('edit');
    setEditingShipment(shipment);
    setForm({
      fromWarehouseId: shipment.fromWarehouseId,
      destinationType: isClient ? 'client' : 'warehouse',
      toWarehouseId: shipment.toWarehouseId || '',
      toClientId: shipment.toClientId || '',
      createNewClient: false,
      clientName: '',
      clientContact: '',
      clientAddress: '',
      clientCity: '',
      clientCountry: '',
      expectedDeliveryDate: shipment.expectedDeliveryDate ? shipment.expectedDeliveryDate.slice(0, 10) : '',
      notes: shipment.notes || '',
      machineIds: (shipment.items || []).map((item) => item.machine.id),
    });
    setIsFormOpen(true);
  };

  const openDetail = async (shipment: BackendShipment) => {
    setDetailShipment(shipment);
    setHistory([]);
    setIsDetailOpen(true);
    setIsLoadingHistory(true);

    try {
      const rows = await shipmentService.history(shipment.id);
      setHistory(rows);
    } catch {
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const toggleMachine = (machineId: string) => {
    setForm((prev) => ({
      ...prev,
      machineIds: prev.machineIds.includes(machineId)
        ? prev.machineIds.filter((id) => id !== machineId)
        : [...prev.machineIds, machineId],
    }));
  };

  const validateForm = (): string | null => {
    if (!form.fromWarehouseId) return 'Source warehouse is required.';
    if (form.machineIds.length === 0) return 'Select at least one machine.';

    if (formMode === 'create') {
      if (form.destinationType === 'warehouse') {
        if (!form.toWarehouseId) return 'Destination warehouse is required.';
        if (form.toWarehouseId === form.fromWarehouseId) return 'Source and destination warehouse cannot be same.';
      }

      if (form.destinationType === 'client') {
        if (form.createNewClient && !form.clientName.trim()) return 'Client name is required.';
        if (!form.createNewClient && !form.toClientId) return 'Please select an existing client or create a new one.';
      }
    }

    return null;
  };

  const submitForm = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation', validationError);
      return;
    }

    setIsSaving(true);

    try {
      if (formMode === 'create') {
        const payload: CreateShipmentInput = {
          machineIds: form.machineIds,
          fromWarehouseId: form.fromWarehouseId,
          expectedDeliveryDate: form.expectedDeliveryDate || undefined,
          notes: form.notes.trim() || undefined,
        };

        if (form.destinationType === 'warehouse') {
          payload.toWarehouseId = form.toWarehouseId;
        } else if (form.createNewClient) {
          payload.client = {
            name: form.clientName.trim(),
            contact: form.clientContact.trim() || undefined,
            address: form.clientAddress.trim() || undefined,
            city: form.clientCity.trim() || undefined,
            country: form.clientCountry.trim() || undefined,
          };
        } else {
          payload.toClientId = form.toClientId;
        }

        await shipmentService.create(payload);
      } else if (editingShipment) {
        await shipmentService.update(editingShipment.id, {
          machineIds: form.machineIds,
          expectedDeliveryDate: form.expectedDeliveryDate || null,
          notes: form.notes,
        });
      }

      setIsFormOpen(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save shipment');
    } finally {
      setIsSaving(false);
    }
  };

  const dispatchShipment = async (shipment: BackendShipment) => {
    try {
      await shipmentService.setStatus(shipment.id, 'IN_TRANSIT', 'Shipment dispatched');
      await loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to dispatch shipment');
    }
  };

  const deliverShipment = async (shipment: BackendShipment) => {
    try {
      await shipmentService.deliver(shipment.id, 'Shipment delivered');
      await loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to deliver shipment');
    }
  };

  const cancelShipment = async (shipment: BackendShipment) => {
    Alert.alert(
      'Cancel Shipment',
      'Are you sure you want to cancel this shipment? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await shipmentService.cancel(shipment.id, 'Shipment cancelled');
              await loadData();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to cancel shipment');
            }
          },
        },
      ]
    );
  };

  const filteredShipments = shipments.filter((shipment) => {
    const statusMatches = activeTab === 'all' || shipment.status === activeTab;

    const q = search.toLowerCase();
    const destination = shipment.toWarehouse
      ? `${shipment.toWarehouse.name} ${shipment.toWarehouse.city}`
      : shipment.toClient
        ? `${shipment.toClient.name} ${shipment.toClient.city || ''}`
        : '';
    const matchesSearch =
      (shipment.trackingId || shipment.id).toLowerCase().includes(q) ||
      shipment.fromWarehouse?.name.toLowerCase().includes(q) ||
      destination.toLowerCase().includes(q);

    return statusMatches && matchesSearch;
  });

  const statusEvent = (targetStatus: string): ShipmentHistoryEntry | null => {
    return history.find((item) => item.toStatus === targetStatus) || null;
  };

  const createdEvent = statusEvent('CREATED');
  const dispatchedEvent = statusEvent('IN_TRANSIT');
  const deliveredEvent = statusEvent('DELIVERED');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Shipments" showBack onBackPress={onBackPress} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const destinationWarehouseOptions = warehouses.filter((w) => w.id !== form.fromWarehouseId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Shipments" subtitle={`${shipments.length} total shipments`} showBack onBackPress={onBackPress} />

      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search shipments" showFilter={false} />
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const count = tab.key === 'all' ? shipments.length : shipments.filter((s) => s.status === tab.key).length;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              <Text style={[styles.tabCount, activeTab === tab.key && styles.tabTextActive]}>{count}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredShipments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        renderItem={({ item }) => (
          <ShipmentCard
            shipment={item}
            onPress={() => openDetail(item)}
            isExpanded={!!expandedIds[item.id]}
            onToggleExpand={() => setExpandedIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
            onDispatch={() => dispatchShipment(item)}
            onDeliver={() => deliverShipment(item)}
            onEdit={() => openEdit(item)}
            onCancel={() => cancelShipment(item)}
          />
        )}
        ListEmptyComponent={<EmptyState icon="truck-remove" title="No shipments found" description="Create one to get started" />}
      />

      <FAB icon="plus" onPress={openCreate} style={styles.fab} backgroundColor={Colors.secondary} />

      <Modal visible={isFormOpen} animationType="slide" onRequestClose={() => setIsFormOpen(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setIsFormOpen(false)}>
                <Icon name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
              <Text style={styles.modalTitle}>{formMode === 'create' ? 'Create Shipment' : 'Edit Shipment'}</Text>
              <View style={{ width: 22 }} />
            </View>

            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.sectionLabel}>Source Warehouse *</Text>
              {warehouses.map((warehouse) => {
                const isManagerLocked = user?.role === 'WAREHOUSE_MANAGER';
                const disabled = isManagerLocked && warehouse.id !== user?.warehouseId;
                return (
                  <Pressable
                    key={warehouse.id}
                    disabled={disabled || formMode === 'edit'}
                    onPress={() => setForm((prev) => ({ ...prev, fromWarehouseId: warehouse.id, machineIds: [] }))}
                    style={[
                      styles.optionRow,
                      form.fromWarehouseId === warehouse.id && styles.optionRowSelected,
                      (disabled || formMode === 'edit') && styles.optionRowDisabled,
                    ]}
                  >
                    <Text style={styles.optionText}>{warehouse.name} - {warehouse.city}</Text>
                    {form.fromWarehouseId === warehouse.id && <Icon name="check" size={16} color={Colors.primary} />}
                  </Pressable>
                );
              })}

              {formMode === 'create' && (
                <>
                  <Text style={styles.sectionLabel}>Destination *</Text>
                  <View style={styles.toggleRow}>
                    <Pressable
                      style={[styles.toggleButton, form.destinationType === 'warehouse' && styles.toggleButtonActive]}
                      onPress={() => setForm((prev) => ({ ...prev, destinationType: 'warehouse' }))}
                    >
                      <Text style={[styles.toggleText, form.destinationType === 'warehouse' && styles.toggleTextActive]}>Warehouse</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.toggleButton, form.destinationType === 'client' && styles.toggleButtonActive]}
                      onPress={() => setForm((prev) => ({ ...prev, destinationType: 'client' }))}
                    >
                      <Text style={[styles.toggleText, form.destinationType === 'client' && styles.toggleTextActive]}>Client</Text>
                    </Pressable>
                  </View>

                  {form.destinationType === 'warehouse' && (
                    <>
                      {destinationWarehouseOptions.map((warehouse) => (
                        <Pressable
                          key={warehouse.id}
                          onPress={() => setForm((prev) => ({ ...prev, toWarehouseId: warehouse.id, toClientId: '' }))}
                          style={[styles.optionRow, form.toWarehouseId === warehouse.id && styles.optionRowSelected]}
                        >
                          <Text style={styles.optionText}>{warehouse.name} - {warehouse.city}</Text>
                          {form.toWarehouseId === warehouse.id && <Icon name="check" size={16} color={Colors.primary} />}
                        </Pressable>
                      ))}
                    </>
                  )}

                  {form.destinationType === 'client' && (
                    <>
                      <View style={styles.toggleRow}>
                        <Pressable
                          style={[styles.toggleButton, !form.createNewClient && styles.toggleButtonActive]}
                          onPress={() => setForm((prev) => ({ ...prev, createNewClient: false }))}
                        >
                          <Text style={[styles.toggleText, !form.createNewClient && styles.toggleTextActive]}>Existing</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.toggleButton, form.createNewClient && styles.toggleButtonActive]}
                          onPress={() => setForm((prev) => ({ ...prev, createNewClient: true, toClientId: '' }))}
                        >
                          <Text style={[styles.toggleText, form.createNewClient && styles.toggleTextActive]}>Create New</Text>
                        </Pressable>
                      </View>

                      {!form.createNewClient && clients.map((client) => (
                        <Pressable
                          key={client.id}
                          onPress={() => setForm((prev) => ({ ...prev, toClientId: client.id, toWarehouseId: '' }))}
                          style={[styles.optionRow, form.toClientId === client.id && styles.optionRowSelected]}
                        >
                          <Text style={styles.optionText}>{client.name}{client.city ? ` - ${client.city}` : ''}</Text>
                          {form.toClientId === client.id && <Icon name="check" size={16} color={Colors.primary} />}
                        </Pressable>
                      ))}

                      {form.createNewClient && (
                        <>
                          <Input label="Client Name *" value={form.clientName} onChangeText={(v) => setForm((p) => ({ ...p, clientName: v }))} />
                          <Input label="Contact" value={form.clientContact} onChangeText={(v) => setForm((p) => ({ ...p, clientContact: v }))} />
                          <Input label="Address" value={form.clientAddress} onChangeText={(v) => setForm((p) => ({ ...p, clientAddress: v }))} />
                          <Input label="City" value={form.clientCity} onChangeText={(v) => setForm((p) => ({ ...p, clientCity: v }))} />
                          <Input label="Country" value={form.clientCountry} onChangeText={(v) => setForm((p) => ({ ...p, clientCountry: v }))} />
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {formMode === 'edit' && editingShipment && (
                <View style={styles.readOnlyBox}>
                  <Text style={styles.readOnlyTitle}>Destination (read-only)</Text>
                  <Text style={styles.readOnlyText}>
                    {editingShipment.toWarehouse
                      ? `${editingShipment.toWarehouse.name} - ${editingShipment.toWarehouse.city}`
                      : editingShipment.toClient
                        ? `${editingShipment.toClient.name}${editingShipment.toClient.city ? ` - ${editingShipment.toClient.city}` : ''}`
                        : '-'}
                  </Text>
                </View>
              )}

              <Text style={styles.sectionLabel}>Machines *</Text>
              {isLoadingMachines ? (
                <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.md }} />
              ) : (
                sourceMachines.map((machine) => (
                  <Pressable
                    key={machine.id}
                    onPress={() => toggleMachine(machine.id)}
                    style={[styles.optionRow, form.machineIds.includes(machine.id) && styles.optionRowSelected]}
                  >
                    <Text style={styles.optionText}>{machine.serialNumber} - {machine.model} ({machine.status})</Text>
                    {form.machineIds.includes(machine.id) && <Icon name="check" size={16} color={Colors.primary} />}
                  </Pressable>
                ))
              )}

              {formMode === 'edit' && editingShipment?.status === 'IN_TRANSIT' && (
                <Text style={styles.hintText}>Machines cannot be removed while shipment is IN_TRANSIT.</Text>
              )}

              <Input
                label="Expected Delivery Date (YYYY-MM-DD)"
                value={form.expectedDeliveryDate}
                onChangeText={(v) => setForm((prev) => ({ ...prev, expectedDeliveryDate: v }))}
                placeholder="2026-04-01"
              />

              <Input
                label="Notes"
                value={form.notes}
                onChangeText={(v) => setForm((prev) => ({ ...prev, notes: v }))}
                multiline
              />

              <View style={styles.modalActions}>
                <Button title="Cancel" onPress={() => setIsFormOpen(false)} disabled={isSaving} />
                <Button
                  title={isSaving ? 'Saving...' : formMode === 'create' ? 'Create Shipment' : 'Save Changes'}
                  onPress={submitForm}
                  disabled={isSaving}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal visible={isDetailOpen} animationType="slide" onRequestClose={() => setIsDetailOpen(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setIsDetailOpen(false)}>
              <Icon name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
            <Text style={styles.modalTitle}>Shipment Details</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView style={styles.modalScroll}>
            {detailShipment && (
              <>
                <View style={styles.detailHero}>
                  <Text style={styles.detailTracking}>{detailShipment.trackingId || detailShipment.id}</Text>
                  <Text style={styles.detailStatus}>{detailShipment.status}</Text>
                </View>

                <Text style={styles.sectionLabel}>Quick Overview</Text>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Created by</Text><Text style={styles.infoValue}>{createdEvent?.changedByUser?.email || '-'} on {formatDateTime(createdEvent?.createdAt)}</Text></View>
                {(detailShipment.status === 'IN_TRANSIT' || detailShipment.status === 'DELIVERED') && (
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Dispatched by</Text><Text style={styles.infoValue}>{dispatchedEvent?.changedByUser?.email || '-'} on {formatDateTime(dispatchedEvent?.createdAt)}</Text></View>
                )}
                {detailShipment.status === 'DELIVERED' && (
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Delivered by</Text><Text style={styles.infoValue}>{deliveredEvent?.changedByUser?.email || '-'} on {formatDateTime(deliveredEvent?.createdAt)}</Text></View>
                )}
                <View style={styles.infoRow}><Text style={styles.infoLabel}>ETA</Text><Text style={styles.infoValue}>{formatDate(detailShipment.expectedDeliveryDate)}</Text></View>

                <Text style={styles.sectionLabel}>Route</Text>
                <Text style={styles.routeDetailText}>
                  {(detailShipment.fromWarehouse?.name || detailShipment.fromWarehouseId)} {'->'} {' '}
                  {detailShipment.toWarehouse
                    ? detailShipment.toWarehouse.name
                    : detailShipment.toClient
                      ? detailShipment.toClient.name
                      : '-'}
                </Text>

                <Text style={styles.sectionLabel}>Machines</Text>
                {(detailShipment.items || []).map((item) => (
                  <View key={item.machine.id} style={styles.machineDetailRow}>
                    <Text style={styles.machineDetailMain}>{item.machine.serialNumber} - {item.machine.model}</Text>
                    <Text style={styles.machineDetailStatus}>{item.machine.status}</Text>
                  </View>
                ))}

                <Text style={styles.sectionLabel}>Activity Log</Text>
                {isLoadingHistory ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.md }} />
                ) : history.length === 0 ? (
                  <Text style={styles.hintText}>No activity yet.</Text>
                ) : (
                  history.map((entry) => (
                    <View key={entry.id} style={styles.activityRow}>
                      <Text style={styles.activityText}>{entry.comment || `${entry.fromStatus} -> ${entry.toStatus}`}</Text>
                      <Text style={styles.activityMeta}>{entry.changedByUser?.email || entry.changedBy} - {formatDateTime(entry.createdAt)}</Text>
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabCount: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionLabel: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  optionRowSelected: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  optionRowDisabled: {
    opacity: 0.5,
  },
  optionText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundElevated,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: Colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.xl,
  },
  hintText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  readOnlyBox: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    padding: Spacing.md,
  },
  readOnlyTitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  readOnlyText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  detailHero: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundElevated,
  },
  detailTracking: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  detailStatus: {
    marginTop: Spacing.xs,
    color: Colors.primary,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    flex: 1,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    flex: 2,
    textAlign: 'right',
  },
  routeDetailText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  machineDetailRow: {
    marginBottom: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
  },
  machineDetailMain: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  machineDetailStatus: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  activityRow: {
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
  },
  activityText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  activityMeta: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
  },
});

export default ShipmentListScreen;
