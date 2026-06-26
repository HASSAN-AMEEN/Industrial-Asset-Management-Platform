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
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { Header, SearchBar, Input, Button, Card, EmptyState, FAB, Skeleton } from '../components';
import { useAuth } from '../store/AuthContext';
import userService, { AppUser, AppUserRole } from '../services/user';
import warehouseService, { Warehouse } from '../services/warehouse';

const ROLE_META: Record<AppUserRole, { label: string; color: string; icon: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: Colors.accent, icon: 'shield-account' },
  WAREHOUSE_MANAGER: { label: 'Warehouse Manager', color: Colors.secondary, icon: 'account-tie' },
  SALES_OPS: { label: 'Sales / Ops', color: Colors.info, icon: 'briefcase-account' },
  TECHNICIAN: { label: 'Technician', color: Colors.warning, icon: 'account-hard-hat' },
};

const ROLE_ORDER: AppUserRole[] = ['SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OPS', 'TECHNICIAN'];

const formatDate = (value?: string): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

interface UserFormState {
  email: string;
  password: string;
  role: AppUserRole;
  warehouseId: string | null;
  contact: string;
}

const emptyForm: UserFormState = { email: '', password: '', role: 'SALES_OPS', warehouseId: null, contact: '' };

interface UserManagementScreenProps {
  onBack?: () => void;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ onBack }) => {
  const { user: currentUser } = useAuth();
  const navigation = useNavigation<any>();
  const handleBack = onBack ?? (() => navigation.goBack());

  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<AppUserRole | 'ALL'>('ALL');

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<UserFormState>(emptyForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      const [userData, warehouseData] = await Promise.all([
        userService.list(),
        warehouseService.list().catch(() => [] as Warehouse[]),
      ]);
      setUsers(userData);
      setWarehouses(warehouseData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load users');
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

  const filteredUsers = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesSearch = !q || u.email.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, searchQuery, roleFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalVisible(true);
  };

  const openEdit = (u: AppUser) => {
    setEditingId(u.id);
    setForm({ email: u.email, password: '', role: u.role, warehouseId: u.warehouseId ?? null, contact: u.contact ?? '' });
    setFormError(null);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSave = async () => {
    const email = form.email.trim();
    if (!email || !email.includes('@')) {
      setFormError('A valid email is required');
      return;
    }
    if (!editingId && form.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }
    if (editingId && form.password && form.password.length < 8) {
      setFormError('Password must be at least 8 characters (or leave blank to keep current)');
      return;
    }
    if (form.role === 'WAREHOUSE_MANAGER' && !form.warehouseId) {
      setFormError('Select a warehouse for a Warehouse Manager');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await userService.update(editingId, {
          email,
          role: form.role,
          warehouseId: form.role === 'WAREHOUSE_MANAGER' ? form.warehouseId : null,
          password: form.password ? form.password : undefined,
          contact: form.contact.trim() || null,
        });
      } else {
        await userService.create({
          email,
          password: form.password,
          role: form.role,
          warehouseId: form.role === 'WAREHOUSE_MANAGER' ? form.warehouseId : null,
          contact: form.contact.trim() || null,
        });
      }
      closeModal();
      await loadData();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (u: AppUser) => {
    Alert.alert('Delete user', `Remove ${u.email}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await userService.remove(u.id);
            await loadData();
          } catch (error) {
            Alert.alert('Could not delete', error instanceof Error ? error.message : 'Failed to delete user');
          }
        },
      },
    ]);
  };

  const renderUser = ({ item }: { item: AppUser }) => {
    const meta = ROLE_META[item.role];
    const isSelf = item.id === currentUser?.id;
    return (
      <Pressable style={styles.userCard} onPress={() => openEdit(item)}>
        <View style={[styles.userAvatar, { backgroundColor: `${meta.color}20` }]}>
          <Icon name={meta.icon} size={22} color={meta.color} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
            {isSelf ? '  (you)' : ''}
          </Text>
          <View style={styles.userMetaRow}>
            <View style={[styles.roleBadge, { backgroundColor: `${meta.color}20` }]}>
              <Text style={[styles.roleBadgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {item.role === 'WAREHOUSE_MANAGER' && item.warehouses?.name && (
              <Text style={styles.userSub} numberOfLines={1}>
                · {item.warehouses.name}
              </Text>
            )}
          </View>
        </View>
        {!isSelf && (
          <Pressable style={styles.deleteButton} hitSlop={8} onPress={() => handleDelete(item)}>
            <Icon name="trash-can-outline" size={20} color={Colors.error} />
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="User Management"
        subtitle={`${users.length} ${users.length === 1 ? 'user' : 'users'}`}
        showBack
        onBackPress={handleBack}
      />

      <View style={styles.searchContainer}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search by email..." showFilter={false} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {(['ALL', ...ROLE_ORDER] as const).map((role) => {
          const selected = roleFilter === role;
          const label = role === 'ALL' ? 'All' : ROLE_META[role].label;
          return (
            <Pressable
              key={role}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              onPress={() => setRoleFilter(role)}
            >
              <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button title="Retry" size="sm" onPress={loadData} />
        </View>
      )}

      {isLoading ? (
        <View style={styles.listContent}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.userCard}>
              <Skeleton width={44} height={44} radius={BorderRadius.full} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Skeleton width={'70%'} height={14} />
                <Skeleton width={'40%'} height={12} style={{ marginTop: Spacing.sm }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon="account-search" title="No users found" description="Try adjusting your search or filters" />
          }
        />
      )}

      <FAB icon="account-plus" onPress={openCreate} style={styles.fab} backgroundColor={Colors.accent} />

      {/* Create / Edit modal */}
      <Modal visible={isModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <Card variant="elevated" style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>{editingId ? 'Edit User' : 'Add User'}</Text>

              <Input
                label="Email *"
                placeholder="user@tayyab.com"
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />

              <Input
                label={editingId ? 'Password (leave blank to keep)' : 'Password *'}
                placeholder={editingId ? '••••••••' : 'At least 8 characters'}
                value={form.password}
                onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
                secureTextEntry
                autoCapitalize="none"
              />

              <Input
                label="Contact Number"
                placeholder="e.g. 0300-1234567"
                value={form.contact}
                onChangeText={(v) => setForm((f) => ({ ...f, contact: v }))}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Role *</Text>
              <View style={styles.roleGrid}>
                {ROLE_ORDER.map((role) => {
                  const meta = ROLE_META[role];
                  const selected = form.role === role;
                  return (
                    <Pressable
                      key={role}
                      style={[styles.roleOption, selected && { borderColor: meta.color, backgroundColor: `${meta.color}15` }]}
                      onPress={() => setForm((f) => ({ ...f, role, warehouseId: role === 'WAREHOUSE_MANAGER' ? f.warehouseId : null }))}
                    >
                      <Icon name={meta.icon} size={16} color={selected ? meta.color : Colors.textSecondary} />
                      <Text style={[styles.roleOptionText, selected && { color: meta.color }]}>{meta.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {form.role === 'WAREHOUSE_MANAGER' && (
                <>
                  <Text style={styles.fieldLabel}>Assigned Warehouse *</Text>
                  {warehouses.length === 0 ? (
                    <Text style={styles.helperText}>No warehouses available. Create one first.</Text>
                  ) : (
                    <View style={styles.warehouseList}>
                      {warehouses.map((w) => {
                        const selected = form.warehouseId === w.id;
                        return (
                          <Pressable
                            key={w.id}
                            style={[styles.warehouseOption, selected && styles.warehouseOptionSelected]}
                            onPress={() => setForm((f) => ({ ...f, warehouseId: w.id }))}
                          >
                            <Icon
                              name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                              size={18}
                              color={selected ? Colors.primary : Colors.textMuted}
                            />
                            <Text style={styles.warehouseOptionText}>
                              {w.name} <Text style={styles.warehouseCity}>· {w.city}</Text>
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </>
              )}

              {!!formError && <Text style={styles.formError}>{formError}</Text>}

              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={closeModal} style={styles.modalButton} />
                <Button
                  title={isSaving ? 'Saving...' : editingId ? 'Save' : 'Create'}
                  onPress={handleSave}
                  disabled={isSaving}
                  style={styles.modalButton}
                />
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
  filterScroll: { flexGrow: 0 },
  filterRow: { gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600' },
  filterChipTextSelected: { color: Colors.white },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundElevated,
    marginBottom: Spacing.sm,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1, marginLeft: Spacing.md },
  userEmail: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: '600', marginBottom: 4 },
  userMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  roleBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  roleBadgeText: { fontSize: FontSizes.xs, fontWeight: '700' },
  userSub: { color: Colors.textMuted, fontSize: FontSizes.xs, flexShrink: 1 },
  deleteButton: { padding: Spacing.sm },
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
  fab: { position: 'absolute', bottom: Spacing.xl, right: Spacing.lg },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: { maxHeight: '85%', padding: Spacing.lg },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  fieldLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
  },
  roleOptionText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600' },
  warehouseList: { gap: Spacing.xs },
  warehouseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
  },
  warehouseOptionSelected: { backgroundColor: `${Colors.primary}12` },
  warehouseOptionText: { fontSize: FontSizes.sm, color: Colors.textPrimary, flex: 1 },
  warehouseCity: { color: Colors.textMuted, fontSize: FontSizes.xs },
  helperText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  formError: { color: Colors.error, fontSize: FontSizes.sm, marginTop: Spacing.md },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  modalButton: { flex: 1 },
});

export default UserManagementScreen;
