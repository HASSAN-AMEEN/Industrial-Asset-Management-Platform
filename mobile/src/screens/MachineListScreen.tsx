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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { Header, MachineCard, FAB, EmptyState, Input, Button, Card, StatusBadge } from '../components';
import machineService, {
  BackendMachine,
  BackendMachineStatus,
  InstallationStatusInput,
  MachineHistoryEntry,
} from '../services/machine';
import warehouseService, { Warehouse } from '../services/warehouse';

interface MachineListScreenProps {
  onMachinePress?: (machine: BackendMachine) => void;
  onBackPress?: () => void;
}

type MachineForm = {
  serialNumber: string;
  model: string;
  category: string;
  warehouseId: string;
  purchaseDate: string;
  cost: string;
};

const initialForm: MachineForm = {
  serialNumber: '',
  model: '',
  category: '',
  warehouseId: '',
  purchaseDate: '',
  cost: '',
};

const statusOptions: BackendMachineStatus[] = [
  'IN_WAREHOUSE',
  'RESERVED',
  'UNDER_SHIPMENT',
  'DELIVERED',
  'INSTALLED',
  'UNDER_MAINTENANCE',
  'RETURNED',
];

const isClientLocationStatus = (status: BackendMachine['status']): boolean => {
  return status === 'DELIVERED' || status === 'INSTALLED';
};

const mapLocationTag = (machine: BackendMachine): string => {
  if (isClientLocationStatus(machine.status)) {
    if (machine.client?.name) {
      const clientCity = machine.client.city ? ` - ${machine.client.city}` : '';
      return `Client: ${machine.client.name}${clientCity}`;
    }

    if (machine.installation?.siteAddress) {
      return `Site: ${machine.installation.siteAddress}`;
    }
  }

  if (machine.installation?.siteAddress) {
    return `Site: ${machine.installation.siteAddress}`;
  }

  return machine.warehouse?.name ? `Warehouse: ${machine.warehouse.name}` : 'Warehouse: Unassigned';
};

const parseDateInput = (value?: string | null): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export const MachineListScreen: React.FC<MachineListScreenProps> = ({
  onMachinePress,
  onBackPress,
}) => {
  const [machines, setMachines] = React.useState<BackendMachine[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [historyByMachineId, setHistoryByMachineId] = React.useState<Record<string, MachineHistoryEntry[]>>({});
  const [statusUpdatingByMachineId, setStatusUpdatingByMachineId] = React.useState<Record<string, boolean>>({});

  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [isAddModalVisible, setIsAddModalVisible] = React.useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = React.useState(false);
  const [isInstallPromptVisible, setIsInstallPromptVisible] = React.useState(false);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showWarehouseOptions, setShowWarehouseOptions] = React.useState(false);

  const [form, setForm] = React.useState<MachineForm>(initialForm);
  const [formErrors, setFormErrors] = React.useState<Partial<Record<keyof MachineForm, string>>>({});

  const [editingMachineId, setEditingMachineId] = React.useState<string | null>(null);
  const [editingMachineStatus, setEditingMachineStatus] = React.useState<BackendMachineStatus | null>(null);
  const [statusMenuMachineId, setStatusMenuMachineId] = React.useState<string | null>(null);
  const [pendingInstalledMachineId, setPendingInstalledMachineId] = React.useState<string | null>(null);
  const [pendingInstallationAddress, setPendingInstallationAddress] = React.useState('');
  const [pendingInstallationNotes, setPendingInstallationNotes] = React.useState('');
  const [installComment, setInstallComment] = React.useState('');
  const [installError, setInstallError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      const [machineData, warehouseData] = await Promise.all([
        machineService.list(),
        warehouseService.list(),
      ]);
      setMachines(machineData);
      setWarehouses(warehouseData);

      const historyPairs = await Promise.all(
        machineData.map(async (machine) => [machine.id, await machineService.history(machine.id)] as const)
      );

      setHistoryByMachineId(Object.fromEntries(historyPairs));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch machines';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const resetForm = () => {
    setForm(initialForm);
    setFormErrors({});
    setShowWarehouseOptions(false);
    setEditingMachineId(null);
    setEditingMachineStatus(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalVisible(true);
  };

  const closeAddModal = () => {
    if (!isSubmitting) {
      setIsAddModalVisible(false);
    }
  };

  const openEditModal = (machine: BackendMachine) => {
    setEditingMachineId(machine.id);
    setEditingMachineStatus(machine.status);
    setForm({
      serialNumber: machine.serialNumber,
      model: machine.model,
      category: machine.category,
      warehouseId: machine.warehouseId,
      purchaseDate: parseDateInput(machine.purchaseDate),
      cost: machine.cost === null || machine.cost === undefined ? '' : String(machine.cost),
    });
    setFormErrors({});
    setShowWarehouseOptions(false);
    setIsEditModalVisible(true);
  };

  const closeEditModal = () => {
    if (!isSubmitting) {
      setIsEditModalVisible(false);
      resetForm();
    }
  };

  const updateField = <K extends keyof MachineForm>(field: K, value: MachineForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (excludeMachineId?: string): boolean => {
    const errors: Partial<Record<keyof MachineForm, string>> = {};

    if (!form.serialNumber.trim()) {
      errors.serialNumber = 'Serial number is required';
    } else {
      const serialExists = machines.some(
        (machine) =>
          machine.id !== excludeMachineId &&
          machine.serialNumber.toLowerCase() === form.serialNumber.trim().toLowerCase()
      );
      if (serialExists) {
        errors.serialNumber = 'Serial number must be unique';
      }
    }

    if (!form.model.trim()) {
      errors.model = 'Machine model is required';
    }

    if (!form.category.trim()) {
      errors.category = 'Machine category is required';
    }

    if (!form.warehouseId) {
      errors.warehouseId = 'Warehouse is required';
    }

    if (form.purchaseDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.purchaseDate.trim())) {
      errors.purchaseDate = 'Use YYYY-MM-DD format';
    }

    if (form.cost.trim() && Number.isNaN(Number(form.cost.trim()))) {
      errors.cost = 'Cost must be numeric';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitCreate = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await machineService.create({
        serialNumber: form.serialNumber.trim(),
        model: form.model.trim(),
        category: form.category.trim(),
        warehouseId: form.warehouseId,
        purchaseDate: form.purchaseDate.trim() || undefined,
        cost: form.cost.trim() ? Number(form.cost.trim()) : undefined,
      });
      setIsAddModalVisible(false);
      resetForm();
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create machine';
      setErrorMessage(message);
      if (message.toLowerCase().includes('serial') || message.toLowerCase().includes('unique')) {
        setFormErrors((prev) => ({ ...prev, serialNumber: 'Serial number already exists' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!editingMachineId) return;
    if (!validateForm(editingMachineId)) return;

    setIsSubmitting(true);
    try {
      await machineService.update(editingMachineId, {
        serialNumber: form.serialNumber.trim(),
        model: form.model.trim(),
        category: form.category.trim(),
        warehouseId: form.warehouseId,
        purchaseDate: form.purchaseDate.trim() || undefined,
        cost: form.cost.trim() ? Number(form.cost.trim()) : undefined,
      });
      setIsEditModalVisible(false);
      resetForm();
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update machine';
      setErrorMessage(message);
      if (message.toLowerCase().includes('serial') || message.toLowerCase().includes('unique')) {
        setFormErrors((prev) => ({ ...prev, serialNumber: 'Serial number already exists' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyStatusChange = async (
    machineId: string,
    nextStatus: BackendMachineStatus,
    options?: { installation?: InstallationStatusInput; comment?: string }
  ) => {
    setStatusUpdatingByMachineId((prev) => ({ ...prev, [machineId]: true }));
    try {
      await machineService.updateStatus(
        machineId,
        nextStatus,
        options?.comment || `Status changed to ${nextStatus}`,
        options?.installation
      );
      setStatusMenuMachineId(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      setErrorMessage(message);
    } finally {
      setStatusUpdatingByMachineId((prev) => ({ ...prev, [machineId]: false }));
    }
  };

  const onStatusSelect = (machineId: string, status: BackendMachineStatus) => {
    if (status === 'INSTALLED') {
      setPendingInstalledMachineId(machineId);
      setPendingInstallationAddress('');
      setPendingInstallationNotes('');
      setInstallComment('');
      setInstallError(null);
      setIsInstallPromptVisible(true);
      return;
    }

    applyStatusChange(machineId, status, { comment: `Status changed to ${status}` });
  };

  const confirmInstalledStatus = async () => {
    if (!pendingInstalledMachineId) return;

    if (!pendingInstallationAddress.trim()) {
      setInstallError('Installation address is required');
      return;
    }

    await applyStatusChange(pendingInstalledMachineId, 'INSTALLED', {
      installation: {
        siteAddress: pendingInstallationAddress.trim(),
        siteNotes: pendingInstallationNotes.trim() || undefined,
      },
      comment: installComment.trim() || 'Status changed to INSTALLED',
    });

    setIsInstallPromptVisible(false);
    setPendingInstalledMachineId(null);
    setPendingInstallationAddress('');
    setPendingInstallationNotes('');
  };

  const selectedWarehouseName =
    warehouses.find((warehouse) => warehouse.id === form.warehouseId)?.name || 'Select warehouse';

  const renderForm = (onSubmit: () => Promise<void>, isEditMode: boolean) => (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Input
        label="Serial Number *"
        placeholder="Unique serial number"
        value={form.serialNumber}
        onChangeText={(value) => updateField('serialNumber', value)}
        autoCapitalize="characters"
        error={formErrors.serialNumber}
      />

      <Input
        label="Machine Model *"
        placeholder="Machine model"
        value={form.model}
        onChangeText={(value) => updateField('model', value)}
        error={formErrors.model}
      />

      <Input
        label="Machine Category *"
        placeholder="Category"
        value={form.category}
        onChangeText={(value) => updateField('category', value)}
        error={formErrors.category}
      />

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Warehouse *</Text>
        <Pressable
          style={[styles.dropdown, formErrors.warehouseId && styles.dropdownError]}
          onPress={() => setShowWarehouseOptions((prev) => !prev)}
        >
          <Text style={[styles.dropdownText, !form.warehouseId && styles.placeholderText]}>
            {selectedWarehouseName}
          </Text>
          <Icon
            name={showWarehouseOptions ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.textSecondary}
          />
        </Pressable>

        {showWarehouseOptions && (
          <View style={styles.dropdownOptions}>
            {warehouses.map((warehouse) => (
              <Pressable
                key={warehouse.id}
                style={styles.dropdownOption}
                onPress={() => {
                  updateField('warehouseId', warehouse.id);
                  setShowWarehouseOptions(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{warehouse.name}</Text>
              </Pressable>
            ))}
            {warehouses.length === 0 && <Text style={styles.emptyDropdownText}>No warehouses found</Text>}
          </View>
        )}
        {!!formErrors.warehouseId && <Text style={styles.inlineError}>{formErrors.warehouseId}</Text>}
      </View>

      <Input
        label="Purchase Date"
        placeholder="YYYY-MM-DD"
        value={form.purchaseDate}
        onChangeText={(value) => updateField('purchaseDate', value)}
        error={formErrors.purchaseDate}
      />

      <Input
        label="Cost"
        placeholder="Numeric value"
        value={form.cost}
        onChangeText={(value) => updateField('cost', value)}
        keyboardType="numeric"
        error={formErrors.cost}
      />

      <View style={styles.actionRow}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => {
            setIsAddModalVisible(false);
            setIsEditModalVisible(false);
            resetForm();
          }}
          style={styles.actionButton}
        />
        <Button title="Save" onPress={onSubmit} loading={isSubmitting} style={styles.actionButton} />
      </View>
    </ScrollView>
  );

  const renderMachine = ({ item }: { item: BackendMachine }) => (
    <View style={styles.cardContainer}>
      <MachineCard
        machine={{
          id: item.id,
          model: item.model,
          serialNumber: item.serialNumber,
          category: item.category,
          status: item.status,
          location: mapLocationTag(item),
        }}
        history={historyByMachineId[item.id] || []}
        statusUpdating={!!statusUpdatingByMachineId[item.id]}
        onPress={() => onMachinePress?.(item)}
        onEditPress={() => openEditModal(item)}
        onStatusPress={() => setStatusMenuMachineId((prev) => (prev === item.id ? null : item.id))}
      />

      {statusMenuMachineId === item.id && (
        <View style={styles.statusMenu}>
          {statusOptions.map((status) => (
            <Pressable key={status} style={styles.statusMenuItem} onPress={() => onStatusSelect(item.id, status)}>
              <StatusBadge status={status} size="sm" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Machines" subtitle={`${machines.length} total machines`} showBack onBackPress={onBackPress} />

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <FlatList
        data={machines}
        renderItem={renderMachine}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="cog-off"
            title={isLoading ? 'Loading machines...' : 'No machines found'}
            description={isLoading ? 'Please wait while data is loading.' : 'Add your first machine to start inventory tracking.'}
          />
        }
      />

      <FAB icon="plus" onPress={openAddModal} style={styles.fab} />

      <Modal visible={isAddModalVisible} transparent animationType="slide" onRequestClose={closeAddModal}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalSheet}>
            <Card variant="elevated" style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Machine</Text>
                <Pressable onPress={closeAddModal} disabled={isSubmitting}>
                  <Icon name="close" size={22} color={Colors.textSecondary} />
                </Pressable>
              </View>
              {renderForm(submitCreate, false)}
            </Card>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={isEditModalVisible} transparent animationType="slide" onRequestClose={closeEditModal}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalSheet}>
            <Card variant="elevated" style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Machine</Text>
                <Pressable onPress={closeEditModal} disabled={isSubmitting}>
                  <Icon name="close" size={22} color={Colors.textSecondary} />
                </Pressable>
              </View>
              {renderForm(submitEdit, true)}
            </Card>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={isInstallPromptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsInstallPromptVisible(false)}
      >
        <View style={styles.modalBackdropCenter}>
          <Card variant="elevated" style={styles.installCard}>
            <Text style={styles.modalTitle}>Set Installation Details</Text>
            <Input
              label="Installation Address *"
              placeholder="Enter full site address"
              value={pendingInstallationAddress}
              onChangeText={(value) => {
                setPendingInstallationAddress(value);
                if (installError) setInstallError(null);
              }}
            />
            <Input
              label="Site Notes"
              placeholder="Optional notes"
              value={pendingInstallationNotes}
              onChangeText={setPendingInstallationNotes}
            />
            <Input
              label="Comment"
              placeholder="Optional"
              value={installComment}
              onChangeText={setInstallComment}
            />
            {!!installError && <Text style={styles.inlineError}>{installError}</Text>}
            <View style={styles.actionRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setIsInstallPromptVisible(false);
                  setPendingInstalledMachineId(null);
                  setPendingInstallationAddress('');
                  setPendingInstallationNotes('');
                  setInstallError(null);
                }}
                style={styles.actionButton}
              />
              <Button title="Confirm" onPress={confirmInstalledStatus} style={styles.actionButton} />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: Spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
  },
  statusMenu: {
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusMenuItem: {
    paddingVertical: Spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalSheet: {
    maxHeight: '90%',
  },
  modalCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: Spacing.xl,
  },
  installCard: {
    paddingBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '600',
  },
  fieldWrap: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.backgroundInput,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownError: {
    borderColor: Colors.error,
  },
  dropdownText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  dropdownOptions: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundElevated,
  },
  dropdownOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownOptionText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
  },
  emptyDropdownText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    padding: Spacing.md,
  },
  inlineError: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});

export default MachineListScreen;
