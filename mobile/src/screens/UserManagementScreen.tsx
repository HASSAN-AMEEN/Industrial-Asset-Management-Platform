import React, { useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../utils/theme';
import { Header, SearchBar, FilterChip, FilterChipGroup, UserCard, FAB, EmptyState } from '../components';
import { User, UserRole } from '../types';

// Sample users data
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@irontrack.com',
    role: 'admin',
    department: 'Operations',
    lastActive: '2 min ago',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@irontrack.com',
    role: 'manager',
    department: 'Field Operations',
    lastActive: '15 min ago',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Mike Brown',
    email: 'mike.b@irontrack.com',
    role: 'technician',
    department: 'Maintenance',
    lastActive: '1 hour ago',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Lisa Davis',
    email: 'lisa.d@irontrack.com',
    role: 'technician',
    department: 'Installation',
    lastActive: '30 min ago',
    isOnline: true,
  },
  {
    id: '5',
    name: 'Robert Wilson',
    email: 'robert.w@irontrack.com',
    role: 'viewer',
    department: 'Quality Control',
    lastActive: '2 hours ago',
    isOnline: false,
  },
  {
    id: '6',
    name: 'Emily Chen',
    email: 'emily.c@irontrack.com',
    role: 'manager',
    department: 'Logistics',
    lastActive: '45 min ago',
    isOnline: false,
  },
];

const filters: { label: string; role: UserRole | 'all'; icon?: string }[] = [
  { label: 'All', role: 'all' },
  { label: 'Admins', role: 'admin', icon: 'shield-account' },
  { label: 'Managers', role: 'manager', icon: 'account-tie' },
  { label: 'Technicians', role: 'technician', icon: 'account-hard-hat' },
  { label: 'Viewers', role: 'viewer', icon: 'eye' },
];

interface UserManagementScreenProps {
  onUserPress?: (user: User) => void;
  onAddPress?: () => void;
  onBackPress?: () => void;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({
  onUserPress,
  onAddPress,
  onBackPress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<UserRole | 'all'>('all');

  const filteredUsers = sampleUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesFilter = selectedFilter === 'all' || user.role === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const getFilterCount = (role: UserRole | 'all') => {
    if (role === 'all') return sampleUsers.length;
    return sampleUsers.filter((u) => u.role === role).length;
  };

  const renderUser = ({ item }: { item: User }) => (
    <UserCard
      user={item}
      onPress={() => onUserPress?.(item)}
      onMenuPress={() => {}}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="User Management"
        subtitle={`${sampleUsers.length} team members`}
        showBack
        onBackPress={onBackPress}
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search users..."
        />
      </View>

      {/* Filters */}
      <FilterChipGroup>
        {filters.map((filter) => (
          <FilterChip
            key={filter.role}
            label={filter.label}
            selected={selectedFilter === filter.role}
            onPress={() => setSelectedFilter(filter.role)}
            icon={filter.icon}
            count={getFilterCount(filter.role)}
          />
        ))}
      </FilterChipGroup>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="account-search"
            title="No users found"
            description="Try adjusting your search or filters"
          />
        }
      />

      {/* FAB */}
      <FAB
        icon="account-plus"
        onPress={() => onAddPress?.()}
        style={styles.fab}
        backgroundColor={Colors.accent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
  },
});

export default UserManagementScreen;
