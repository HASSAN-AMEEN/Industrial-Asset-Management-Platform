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
import { Header, MachineCard, FAB, EmptyState, Input, Button, Card } from '../components';
import machineService, { BackendMachine } from '../services/machine';
import warehouseService, { Warehouse } from '../services/warehouse';

interface MachineListScreenProps {
  onMachinePress?: (machine: BackendMachine) => void;
  onBackPress?: () => void;
}

type AddMachineForm = {
  serialNumber: string;
  model: string;
  category: string;
  warehouseId: string;
  purchaseDate: string;
  cost: string;
  installationLocation: string;
};

const initialForm: AddMachineForm = {
  serialNumber: '',
  model: '',
  category: '',
  warehouseId: '',
  purchaseDate: '',
  cost: '',
  installationLocation: '',
};

const initialErrors: Partial<Record<keyof AddMachineForm, string>> = {};

const isClientLocationStatus = (status: BackendMachine['status']): boolean => {
  return status === 'DELIVERED' || status === 'INSTALLED';
};

const mapLocationTag = (machine: BackendMachine): string => {
  if (isClientLocationStatus(machine.status)) {
    if (machine.client?.name) {
      const clientCity = machine.client.city ? ` - ${machine.client.city}` : '';
      return `Client: ${machine.client.name}${clientCity}`;
    }

    if (machine.installationLocation) {
      return `Client Site: ${machine.installationLocation}`;
    }
  }

  return machine.warehouse?.name ? `Warehouse: ${machine.warehouse.name}` : 'Warehouse: Unassigned';
};

export const MachineListScreen: React.FC<MachineListScreenProps> = ({
  onMachinePress,
  onBackPress,
}) => {
  const [machines, setMachines] = React.useState<BackendMachine[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showWarehouseOptions, setShowWarehouseOptions] = React.useState(false);
  const [form, setForm] = React.useState<AddMachineForm>(initialForm);
  const [formErrors, setFormErrors] = React.useState<Partial<Record<keyof AddMachineForm, string>>>(
    initialErrors
  );

  const loadData = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      const [machineData, warehouseData] = await Promise.all([
        machineService.list(),
        warehouseService.list(),
      ]);
      setMachines(machineData);
      setWarehouses(warehouseData);
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

  const openModal = () => {
    setForm(initialForm);
    setFormErrors(initialErrors);
    setShowWarehouseOptions(false);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }
    setIsModalVisible(false);
  };

  const updateField = <K extends keyof AddMachineForm>(field: K, value: AddMachineForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof AddMachineForm, string>> = {};

    if (!form.serialNumber.trim()) {
      errors.serialNumber = 'Serial number is required';
    } else {
      const serialExists = machines.some(
        (machine) => machine.serialNumber.toLowerCase() === form.serialNumber.trim().toLowerCase()
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await machineService.create({
        serialNumber: form.serialNumber.trim(),
        model: form.model.trim(),
        category: form.category.trim(),
        warehouseId: form.warehouseId,
        purchaseDate: form.purchaseDate.trim() || undefined,
        cost: form.cost.trim() ? Number(form.cost.trim()) : undefined,
        installationLocation: form.installationLocation.trim() || undefined,
      });

      setIsModalVisible(false);
      setForm(initialForm);
      setFormErrors(initialErrors);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create machine';
      const nextErrors: Partial<Record<keyof AddMachineForm, string>> = {};

      if (message.toLowerCase().includes('serial') || message.toLowerCase().includes('unique')) {
        nextErrors.serialNumber = 'Serial number already exists';
      }

      setFormErrors((prev) => ({ ...prev, ...nextErrors }));
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        onPress={() => onMachinePress?.(item)}
      />
    </View>
  );

  const selectedWarehouseName =
    warehouses.find((warehouse) => warehouse.id === form.warehouseId)?.name || 'Select warehouse';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Machines"
        subtitle={`${machines.length} total machines`}
        showBack
        onBackPress={onBackPress}
      />

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Machine List */}
      <FlatList
        data={machines}
        renderItem={renderMachine}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="cog-off"
            title={isLoading ? 'Loading machines...' : 'No machines found'}
            description={
              isLoading
                ? 'Please wait while data is loading.'
                : 'Add your first machine to start inventory tracking.'
            }
          />
        }
      />

      {/* FAB */}
      <FAB icon="plus" onPress={openModal} style={styles.fab} />

      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalSheet}
          >
            <Card variant="elevated" style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Machine</Text>
                <Pressable onPress={closeModal} disabled={isSubmitting}>
                  <Icon name="close" size={22} color={Colors.textSecondary} />
                </Pressable>
              </View>

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
                      {warehouses.length === 0 && (
                        <Text style={styles.emptyDropdownText}>No warehouses found</Text>
                      )}
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

                <Input
                  label="Installation Location"
                  placeholder="Optional location notes"
                  value={form.installationLocation}
                  onChangeText={(value) => updateField('installationLocation', value)}
                />

                <View style={styles.actionRow}>
                  <Button title="Cancel" variant="outline" onPress={closeModal} style={styles.actionButton} />
                  <Button
                    title="Create Machine"
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    style={styles.actionButton}
                  />
                </View>
              </ScrollView>
            </Card>
          </KeyboardAvoidingView>
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
    marginBottom: 0,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
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
