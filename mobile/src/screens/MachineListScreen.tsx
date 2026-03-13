import React, { useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../utils/theme';
import {
  Header,
  SearchBar,
  FilterChip,
  FilterChipGroup,
  MachineCard,
  FAB,
  EmptyState,
} from '../components';
import { Machine, MachineStatus } from '../types';

// Sample data
const sampleMachines: Machine[] = [
  {
    id: '1',
    serialNumber: 'M-4521',
    model: 'Industrial Pump X200',
    type: 'Pump',
    status: 'active',
    location: 'Houston, TX',
    lastService: 'Feb 15, 2024',
    nextService: 'May 15, 2024',
    healthScore: 92,
  },
  {
    id: '2',
    serialNumber: 'M-4522',
    model: 'Compressor Pro 500',
    type: 'Compressor',
    status: 'maintenance',
    location: 'Dallas, TX',
    lastService: 'Jan 20, 2024',
    nextService: 'Apr 20, 2024',
    healthScore: 45,
  },
  {
    id: '3',
    serialNumber: 'M-4523',
    model: 'Generator Max 1000',
    type: 'Generator',
    status: 'transit',
    location: 'In Transit to Austin',
    lastService: 'Mar 01, 2024',
    nextService: 'Jun 01, 2024',
    healthScore: 78,
  },
  {
    id: '4',
    serialNumber: 'M-4524',
    model: 'Hydraulic Press H80',
    type: 'Press',
    status: 'active',
    location: 'San Antonio, TX',
    lastService: 'Feb 28, 2024',
    nextService: 'May 28, 2024',
    healthScore: 88,
  },
  {
    id: '5',
    serialNumber: 'M-4525',
    model: 'Industrial Pump X200',
    type: 'Pump',
    status: 'inactive',
    location: 'Warehouse - Houston',
    lastService: 'Dec 10, 2023',
    nextService: 'Mar 10, 2024',
    healthScore: 65,
  },
];

const filters: { label: string; status: MachineStatus | 'all'; count: number }[] = [
  { label: 'All', status: 'all', count: 247 },
  { label: 'Active', status: 'active', count: 198 },
  { label: 'Maintenance', status: 'maintenance', count: 26 },
  { label: 'Transit', status: 'transit', count: 23 },
];

interface MachineListScreenProps {
  onMachinePress?: (machine: Machine) => void;
  onAddPress?: () => void;
  onBackPress?: () => void;
}

export const MachineListScreen: React.FC<MachineListScreenProps> = ({
  onMachinePress,
  onAddPress,
  onBackPress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<MachineStatus | 'all'>('all');

  const filteredMachines = sampleMachines.filter((machine) => {
    const matchesSearch =
      machine.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = selectedFilter === 'all' || machine.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const renderMachine = ({ item }: { item: Machine }) => (
    <View style={styles.cardContainer}>
      <MachineCard machine={item} onPress={() => onMachinePress?.(item)} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Machines"
        subtitle="247 total machines"
        showBack
        onBackPress={onBackPress}
        rightIcon="sort-variant"
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search machines..."
        />
      </View>

      {/* Filters */}
      <FilterChipGroup>
        {filters.map((filter) => (
          <FilterChip
            key={filter.status}
            label={filter.label}
            selected={selectedFilter === filter.status}
            onPress={() => setSelectedFilter(filter.status)}
            count={filter.count}
          />
        ))}
      </FilterChipGroup>

      {/* Machine List */}
      <FlatList
        data={filteredMachines}
        renderItem={renderMachine}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="cog-off"
            title="No machines found"
            description="Try adjusting your search or filters"
          />
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        onPress={() => onAddPress?.()}
        style={styles.fab}
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
  cardContainer: {
    marginBottom: 0,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
  },
});

export default MachineListScreen;
