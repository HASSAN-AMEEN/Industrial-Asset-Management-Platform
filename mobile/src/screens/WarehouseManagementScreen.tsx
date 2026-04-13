import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { Header, Card, Input, Button, EmptyState } from '../components';
import { useAuth } from '../store/AuthContext';
import warehouseService, { Warehouse, WarehouseManager } from '../services/warehouse';

const emptyWarehouseForm = {
  name: '',
  address: '',
  city: '',
  contact: '',
  capacity: '',
};

const emptyManagerForm = {
  email: '',
  password: '',
};

const formatRole = (role?: string): string => {
  if (!role) return 'user';
  return role.toLowerCase().replace(/_/g, ' ');
};

export const WarehouseManagementScreen: React.FC = () => {
  const { user } = useAuth();
  const scrollRef = React.useRef<ScrollView | null>(null);

  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [managers, setManagers] = React.useState<WarehouseManager[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = React.useState<string | null>(null);

  const [warehouseForm, setWarehouseForm] = React.useState(emptyWarehouseForm);
  const [managerForm, setManagerForm] = React.useState(emptyManagerForm);

  const [editingWarehouseId, setEditingWarehouseId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingWarehouse, setIsSavingWarehouse] = React.useState(false);
  const [isSavingManager, setIsSavingManager] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const selectedWarehouse = React.useMemo(
    () => warehouses.find((warehouse) => warehouse.id === selectedWarehouseId) || null,
    [warehouses, selectedWarehouseId]
  );

  const loadData = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      const [warehouseData, managerData] = await Promise.all([
        warehouseService.list(),
        warehouseService.listManagers(),
      ]);

      setWarehouses(warehouseData);
      setManagers(managerData);

      if (!selectedWarehouseId && warehouseData.length > 0) {
        setSelectedWarehouseId(warehouseData[0].id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load warehouse data';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWarehouseId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const resetWarehouseForm = () => {
    setWarehouseForm(emptyWarehouseForm);
    setEditingWarehouseId(null);
  };

  const onSaveWarehouse = async () => {
    if (!warehouseForm.name.trim() || !warehouseForm.address.trim() || !warehouseForm.city.trim()) {
      Alert.alert('Validation', 'Name, address, and city are required.');
      return;
    }

    setIsSavingWarehouse(true);
    try {
      const payload = {
        name: warehouseForm.name.trim(),
        address: warehouseForm.address.trim(),
        city: warehouseForm.city.trim(),
        contact: warehouseForm.contact.trim() || undefined,
        capacity: warehouseForm.capacity ? Number(warehouseForm.capacity) : undefined,
      };

      if (editingWarehouseId) {
        await warehouseService.update(editingWarehouseId, payload);
      } else {
        await warehouseService.create(payload);
      }

      resetWarehouseForm();
      await loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save warehouse');
    } finally {
      setIsSavingWarehouse(false);
    }
  };

  const onEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouseId(warehouse.id);
    setWarehouseForm({
      name: warehouse.name || '',
      address: warehouse.address || '',
      city: warehouse.city || '',
      contact: warehouse.contact || '',
      capacity: warehouse.capacity ? String(warehouse.capacity) : '',
    });
    setSelectedWarehouseId(warehouse.id);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  const onDeleteWarehouse = (warehouse: Warehouse) => {
    Alert.alert(
      'Delete Warehouse',
      `Are you sure you want to delete ${warehouse.name}? This will fail if machines are still attached.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await warehouseService.remove(warehouse.id);
              if (selectedWarehouseId === warehouse.id) {
                setSelectedWarehouseId(null);
              }
              await loadData();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete warehouse');
            }
          },
        },
      ]
    );
  };

  const onAssignManager = async () => {
    if (!selectedWarehouseId || !selectedManagerId) {
      Alert.alert('Selection required', 'Select both warehouse and manager first.');
      return;
    }

    setIsSavingManager(true);
    try {
      await warehouseService.assignManager(selectedWarehouseId, selectedManagerId);
      await loadData();
      Alert.alert('Success', 'Manager assigned successfully.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to assign manager');
    } finally {
      setIsSavingManager(false);
    }
  };

  const onCreateManager = async () => {
    if (!selectedWarehouseId) {
      Alert.alert('Select warehouse', 'Pick a warehouse before creating manager.');
      return;
    }

    if (!managerForm.email.trim() || managerForm.password.length < 8) {
      Alert.alert('Validation', 'Valid email and min 8-char password are required.');
      return;
    }

    setIsSavingManager(true);
    try {
      await warehouseService.createManager(
        managerForm.email.trim().toLowerCase(),
        managerForm.password,
        selectedWarehouseId
      );
      setManagerForm(emptyManagerForm);
      await loadData();
      Alert.alert('Success', 'Warehouse manager account created and assigned.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create manager');
    } finally {
      setIsSavingManager(false);
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Warehouse Management" subtitle={`Signed in as ${formatRole(user?.role)}`} />
        <View style={styles.centerContent}>
          <EmptyState
            icon="shield-lock"
            title="Super Admin Access Only"
            description="Only super admin can manage warehouses and manager assignments."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Warehouse Management" subtitle={`${warehouses.length} warehouses`} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
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
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {errorMessage && (
              <Card variant="outlined" style={styles.errorCard}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <Button title="Retry" size="sm" onPress={loadData} />
              </Card>
            )}

            <Card variant="elevated" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {editingWarehouseId ? 'Edit Warehouse' : 'Create Warehouse'}
              </Text>
              <Input
                label="Warehouse Name"
                value={warehouseForm.name}
                onChangeText={(value) => setWarehouseForm((prev) => ({ ...prev, name: value }))}
                placeholder="Main Warehouse"
              />
              <Input
                label="Address"
                value={warehouseForm.address}
                onChangeText={(value) => setWarehouseForm((prev) => ({ ...prev, address: value }))}
                placeholder="Street / Area"
              />
              <Input
                label="City"
                value={warehouseForm.city}
                onChangeText={(value) => setWarehouseForm((prev) => ({ ...prev, city: value }))}
                placeholder="Karachi"
              />
              <Input
                label="Contact"
                value={warehouseForm.contact}
                onChangeText={(value) => setWarehouseForm((prev) => ({ ...prev, contact: value }))}
                placeholder="+92..."
              />
              <Input
                label="Capacity"
                value={warehouseForm.capacity}
                onChangeText={(value) => setWarehouseForm((prev) => ({ ...prev, capacity: value }))}
                placeholder="1000"
                keyboardType="numeric"
              />
              <View style={styles.inlineActions}>
                <Button
                  title={editingWarehouseId ? 'Update Warehouse' : 'Create Warehouse'}
                  onPress={onSaveWarehouse}
                  loading={isSavingWarehouse}
                  style={styles.flexButton}
                />
                {editingWarehouseId && (
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={resetWarehouseForm}
                    style={styles.flexButton}
                  />
                )}
              </View>
            </Card>

            <Card variant="elevated" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Assign Existing Manager</Text>
              <Text style={styles.helperText}>
                Selected warehouse: {selectedWarehouse ? selectedWarehouse.name : 'None'}
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {warehouses.map((warehouse) => {
                  const selected = selectedWarehouseId === warehouse.id;
                  return (
                    <Pressable
                      key={warehouse.id}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setSelectedWarehouseId(warehouse.id)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{warehouse.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {managers.map((manager) => {
                  const selected = selectedManagerId === manager.id;
                  const subtitle = manager.warehouseId ? 'Assigned' : 'Unassigned';
                  return (
                    <Pressable
                      key={manager.id}
                      style={[styles.managerChip, selected && styles.chipSelected]}
                      onPress={() => setSelectedManagerId(manager.id)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{manager.email}</Text>
                      <Text style={styles.managerMeta}>{subtitle}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Button title="Assign Manager" onPress={onAssignManager} loading={isSavingManager} />
            </Card>

            <Card variant="elevated" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Create New Manager</Text>
              <Text style={styles.helperText}>
                This creates a `WAREHOUSE_MANAGER` account and assigns it to selected warehouse.
              </Text>
              <Input
                label="Manager Email"
                value={managerForm.email}
                onChangeText={(value) => setManagerForm((prev) => ({ ...prev, email: value }))}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="manager@example.com"
              />
              <Input
                label="Temporary Password"
                value={managerForm.password}
                onChangeText={(value) => setManagerForm((prev) => ({ ...prev, password: value }))}
                placeholder="min 8 characters"
                secureTextEntry
              />
              <Button title="Create Manager" onPress={onCreateManager} loading={isSavingManager} />
            </Card>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Warehouses</Text>
              <Text style={styles.helperText}>{warehouses.length} total</Text>
            </View>

            {warehouses.length === 0 ? (
              <EmptyState
                icon="warehouse"
                title="No warehouses yet"
                description="Create your first warehouse to start machine allocation."
              />
            ) : (
              warehouses.map((warehouse) => (
                <Card key={warehouse.id} variant="elevated" style={styles.warehouseCard}>
                  <View style={styles.cardHead}>
                    <View>
                      <Text style={styles.warehouseName}>{warehouse.name}</Text>
                      <Text style={styles.warehouseMeta}>{warehouse.city}</Text>
                    </View>
                    <Pressable onPress={() => setSelectedWarehouseId(warehouse.id)} style={styles.selectButton}>
                      <Icon name="check-circle" size={20} color={selectedWarehouseId === warehouse.id ? Colors.success : Colors.textMuted} />
                    </Pressable>
                  </View>

                  <Text style={styles.warehouseMeta}>{warehouse.address}</Text>
                  <Text style={styles.warehouseMeta}>Manager: {warehouse.manager || 'Not assigned'}</Text>
                  <Text style={styles.warehouseMeta}>Contact: {warehouse.contact || 'N/A'}</Text>
                  <Text style={styles.warehouseMeta}>Capacity: {warehouse.capacity ?? 'N/A'}</Text>

                  <View style={styles.inlineActions}>
                    <Button
                      title="Edit"
                      variant="outline"
                      onPress={() => onEditWarehouse(warehouse)}
                      style={styles.flexButton}
                    />
                    <Button
                      title="Delete"
                      variant="danger"
                      onPress={() => onDeleteWarehouse(warehouse)}
                      style={styles.flexButton}
                    />
                  </View>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  loaderContainer: {
    paddingTop: Spacing.xxxl,
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  sectionCard: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  helperText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  chipRow: {
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundElevated,
  },
  managerChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundElevated,
    minWidth: 170,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}20`,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  chipTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  managerMeta: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warehouseCard: {
    gap: Spacing.sm,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warehouseName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  warehouseMeta: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  selectButton: {
    padding: Spacing.xs,
  },
  errorCard: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
});

export default WarehouseManagementScreen;
