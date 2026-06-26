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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDrawer } from '../store/DrawerContext';
import { useAuth } from '../store/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { Header, MachineCard, FAB, EmptyState, ErrorState, Input, Button, Card, StatusBadge, SearchBar } from '../components';
import { parseApiError, ParsedApiError } from '../utils/errors';
import machineService, {
  BackendMachine,
  BackendMachineStatus,
  InstallationStatusInput,
} from '../services/machine';

const PAGE_SIZE = 20;
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
  const navigation = useNavigation<any>();
  const { open: openDrawer } = useDrawer();
  const { user } = useAuth();
  // SRD §2: only Super Admin & Warehouse Manager create/edit/delete machines or change status.
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'WAREHOUSE_MANAGER';
  const [machines, setMachines] = React.useState<BackendMachine[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [statusUpdatingByMachineId, setStatusUpdatingByMachineId] = React.useState<Record<string, boolean>>({});

  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [totalMachines, setTotalMachines] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<ParsedApiError | null>(null);

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
  const [pendingLocationUrl, setPendingLocationUrl] = React.useState('');
  const [pendingInstallationAddress, setPendingInstallationAddress] = React.useState('');
  const [pendingInstallationNotes, setPendingInstallationNotes] = React.useState('');
  const [installComment, setInstallComment] = React.useState('');
  const [installError, setInstallError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [activeFilterDropdown, setActiveFilterDropdown] = React.useState<'status' | 'warehouse' | 'category' | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | BackendMachineStatus>('ALL');
  const [warehouseFilter, setWarehouseFilter] = React.useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL');
  const [fromDateFilter, setFromDateFilter] = React.useState('');
  const [toDateFilter, setToDateFilter] = React.useState('');

  const buildListParams = React.useCallback(
    (pageNum: number) => ({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      warehouseId: warehouseFilter === 'ALL' ? undefined : warehouseFilter,
      serialNumber: searchQuery.trim() || undefined,
      category: categoryFilter === 'ALL' ? undefined : categoryFilter,
      purchaseFrom: fromDateFilter.trim() || undefined,
      purchaseTo: toDateFilter.trim() || undefined,
      page: pageNum,
      limit: PAGE_SIZE,
    }),
    [statusFilter, warehouseFilter, searchQuery, categoryFilter, fromDateFilter, toDateFilter]
  );

  const loadWarehouses = React.useCallback(async () => {
    try {
      setWarehouses(await warehouseService.list());
    } catch {
      // Non-fatal for the machine list itself.
    }
  }, []);

  // Fetch page 1 with the current filters (server-side). Used on filter change and after mutations.
  const loadData = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      setIsLoading(true);
      const res = await machineService.list(buildListParams(1));
      setMachines(res.items);
      setPage(res.page);
      setHasMore(res.hasMore);
      setTotalMachines(res.total);
    } catch (error) {
      setErrorMessage(parseApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, [buildListParams]);

  const loadMore = React.useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    try {
      setIsLoadingMore(true);
      const res = await machineService.list(buildListParams(page + 1));
      setMachines((prev) => [...prev, ...res.items]);
      setPage(res.page);
      setHasMore(res.hasMore);
      setTotalMachines(res.total);
    } catch (error) {
      setErrorMessage(parseApiError(error));
    } finally {
      setIsLoadingMore(false);
    }
  }, [buildListParams, hasMore, isLoadingMore, isLoading, page]);

  // Warehouses load once (for the filter dropdown + add/edit form).
  React.useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  // Refetch page 1 (debounced) whenever a filter or the search query changes.
  const filterKey = [
    statusFilter,
    warehouseFilter,
    categoryFilter,
    searchQuery.trim(),
    fromDateFilter.trim(),
    toDateFilter.trim(),
  ].join('|');
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadWarehouses(), loadData()]);
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
      const parsed = parseApiError(error);
      setErrorMessage(parsed);
      const rawLower = (parsed.rawMessage || '').toLowerCase();
      if (rawLower.includes('serial') || rawLower.includes('unique')) {
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
      const parsed = parseApiError(error);
      setErrorMessage(parsed);
      const rawLower = (parsed.rawMessage || '').toLowerCase();
      if (rawLower.includes('serial') || rawLower.includes('unique')) {
        setFormErrors((prev) => ({ ...prev, serialNumber: 'Serial number already exists' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteMachine = (machine: BackendMachine) => {
    Alert.alert(
      'Delete Machine',
      `Delete ${machine.serialNumber} - ${machine.model}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await machineService.remove(machine.id);
              if (statusMenuMachineId === machine.id) {
                setStatusMenuMachineId(null);
              }
              await loadData();
            } catch (error) {
              setErrorMessage(parseApiError(error));
            }
          },
        },
      ]
    );
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
      setErrorMessage(parseApiError(error));
    } finally {
      setStatusUpdatingByMachineId((prev) => ({ ...prev, [machineId]: false }));
    }
  };

  const onStatusSelect = (machineId: string, status: BackendMachineStatus) => {
    if (status === 'INSTALLED') {
      setPendingInstalledMachineId(machineId);
      setPendingLocationUrl('');
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

    const locationUrl = pendingLocationUrl.trim();
    const siteAddress = pendingInstallationAddress.trim();

    if (!locationUrl && !siteAddress) {
      setInstallError('Paste a Google Maps location link, or enter a site address.');
      return;
    }

    // Light client-side sanity check so obvious mistakes are caught before the request.
    if (locationUrl && !/^https?:\/\//i.test(locationUrl) && !/-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+/.test(locationUrl)) {
      setInstallError('That doesn’t look like a Google Maps link. Use Share → Copy link in Google Maps.');
      return;
    }

    await applyStatusChange(pendingInstalledMachineId, 'INSTALLED', {
      installation: {
        locationUrl: locationUrl || undefined,
        siteAddress: siteAddress || undefined,
        siteNotes: pendingInstallationNotes.trim() || undefined,
      },
      comment: installComment.trim() || 'Status changed to INSTALLED',
    });

    setIsInstallPromptVisible(false);
    setPendingInstalledMachineId(null);
    setPendingLocationUrl('');
    setPendingInstallationAddress('');
    setPendingInstallationNotes('');
  };

  const selectedWarehouseName =
    warehouses.find((warehouse) => warehouse.id === form.warehouseId)?.name || 'Select warehouse';

  const categoryOptions = React.useMemo(() => {
    const categories = Array.from(new Set(machines.map((machine) => machine.category).filter(Boolean)));
    return categories.sort((a, b) => a.localeCompare(b));
  }, [machines]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setWarehouseFilter('ALL');
    setCategoryFilter('ALL');
    setFromDateFilter('');
    setToDateFilter('');
    setActiveFilterDropdown(null);
  };

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
        statusUpdating={!!statusUpdatingByMachineId[item.id]}
        onPress={() => (onMachinePress ? onMachinePress(item) : navigation.navigate('MachineDetail', { id: item.id }))}
        onEditPress={canManage ? () => openEditModal(item) : undefined}
        onDeletePress={canManage ? () => confirmDeleteMachine(item) : undefined}
        onStatusPress={canManage ? () => setStatusMenuMachineId((prev) => (prev === item.id ? null : item.id)) : undefined}
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Machines" subtitle={`${totalMachines} total machines`} showMenu onMenuPress={openDrawer} />

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by serial number"
          showFilter
          onFilterPress={() => {
            setFiltersOpen((prev) => !prev);
            setActiveFilterDropdown(null);
          }}
        />
      </View>

      {filtersOpen && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterLabel}>Status</Text>
          <Pressable
            style={styles.filterDropdown}
            onPress={() =>
              setActiveFilterDropdown((prev) => (prev === 'status' ? null : 'status'))
            }
          >
            <Text style={styles.filterDropdownText}>
              {statusFilter === 'ALL' ? 'All' : statusFilter.replaceAll('_', ' ')}
            </Text>
            <Icon name={activeFilterDropdown === 'status' ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
          </Pressable>
          {activeFilterDropdown === 'status' && (
            <View style={styles.filterOptions}>
              <Pressable style={styles.filterOption} onPress={() => { setStatusFilter('ALL'); setActiveFilterDropdown(null); }}>
                <Text style={styles.filterOptionText}>All</Text>
              </Pressable>
              {statusOptions.map((status) => (
                <Pressable key={status} style={styles.filterOption} onPress={() => { setStatusFilter(status); setActiveFilterDropdown(null); }}>
                  <Text style={styles.filterOptionText}>{status.replaceAll('_', ' ')}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.filterLabel}>Warehouse</Text>
          <Pressable
            style={styles.filterDropdown}
            onPress={() =>
              setActiveFilterDropdown((prev) => (prev === 'warehouse' ? null : 'warehouse'))
            }
          >
            <Text style={styles.filterDropdownText}>
              {warehouseFilter === 'ALL'
                ? 'All'
                : warehouses.find((warehouse) => warehouse.id === warehouseFilter)?.name || 'All'}
            </Text>
            <Icon name={activeFilterDropdown === 'warehouse' ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
          </Pressable>
          {activeFilterDropdown === 'warehouse' && (
            <View style={styles.filterOptions}>
              <Pressable style={styles.filterOption} onPress={() => { setWarehouseFilter('ALL'); setActiveFilterDropdown(null); }}>
                <Text style={styles.filterOptionText}>All</Text>
              </Pressable>
              {warehouses.map((warehouse) => (
                <Pressable key={warehouse.id} style={styles.filterOption} onPress={() => { setWarehouseFilter(warehouse.id); setActiveFilterDropdown(null); }}>
                  <Text style={styles.filterOptionText}>{warehouse.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.filterLabel}>Category</Text>
          <Pressable
            style={styles.filterDropdown}
            onPress={() =>
              setActiveFilterDropdown((prev) => (prev === 'category' ? null : 'category'))
            }
          >
            <Text style={styles.filterDropdownText}>{categoryFilter === 'ALL' ? 'All' : categoryFilter}</Text>
            <Icon name={activeFilterDropdown === 'category' ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
          </Pressable>
          {activeFilterDropdown === 'category' && (
            <View style={styles.filterOptions}>
              <Pressable style={styles.filterOption} onPress={() => { setCategoryFilter('ALL'); setActiveFilterDropdown(null); }}>
                <Text style={styles.filterOptionText}>All</Text>
              </Pressable>
              {categoryOptions.map((category) => (
                <Pressable key={category} style={styles.filterOption} onPress={() => { setCategoryFilter(category); setActiveFilterDropdown(null); }}>
                  <Text style={styles.filterOptionText}>{category}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.filterLabel}>Purchase Date Range</Text>
          <View style={styles.dateRangeRow}>
            <Input
              label="From"
              placeholder="YYYY-MM-DD"
              value={fromDateFilter}
              onChangeText={setFromDateFilter}
              containerStyle={styles.dateInput}
            />
            <Input
              label="To"
              placeholder="YYYY-MM-DD"
              value={toDateFilter}
              onChangeText={setToDateFilter}
              containerStyle={styles.dateInput}
            />
          </View>

          <Button title="Clear Filters" variant="outline" onPress={clearFilters} />
        </View>
      )}

      {errorMessage && (
        <ErrorState
          error={errorMessage}
          variant="inline"
          onRetry={loadData}
          style={styles.errorContainer}
        />
      )}

      <FlatList
        data={machines}
        renderItem={renderMachine}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.listFooter}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="cog-off"
            title={isLoading ? 'Loading machines...' : 'No machines found'}
            description={
              isLoading
                ? 'Please wait while data is loading.'
                : filtersOpen || searchQuery || statusFilter !== 'ALL' || warehouseFilter !== 'ALL' || categoryFilter !== 'ALL' || fromDateFilter || toDateFilter
                  ? 'Try adjusting your search or filters.'
                  : 'Add your first machine to start inventory tracking.'
            }
          />
        }
      />

      {canManage && <FAB icon="plus" onPress={openAddModal} style={styles.fab} />}

      <Modal visible={isAddModalVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={closeAddModal}>
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

      <Modal visible={isEditModalVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={closeEditModal}>
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
        statusBarTranslucent
        onRequestClose={() => setIsInstallPromptVisible(false)}
      >
        <View style={styles.modalBackdropCenter}>
          <Card variant="elevated" style={styles.installCard}>
            <Text style={styles.modalTitle}>Set Installation Details</Text>
            <Input
              label="Google Maps Location Link *"
              placeholder="Paste link from Google Maps"
              value={pendingLocationUrl}
              onChangeText={(value) => {
                setPendingLocationUrl(value);
                if (installError) setInstallError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.installHint}>
              In Google Maps, find the exact spot → tap Share → Copy link, then paste it here for an accurate pin.
            </Text>
            <Input
              label="Site Address"
              placeholder="Optional label (e.g. Plot 12, Korangi)"
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
                  setPendingLocationUrl('');
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  filtersPanel: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  filterDropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundElevated,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterDropdownText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  filterOptions: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundElevated,
  },
  filterOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterOptionText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
  },
  listFooter: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
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
  installHint: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    lineHeight: 16,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
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
