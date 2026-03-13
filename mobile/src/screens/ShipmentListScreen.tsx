import React, { useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { Header, SearchBar, ShipmentCard, FAB, EmptyState } from '../components';
import { Shipment, ShipmentStatus } from '../types';

// Sample data
const sampleShipments: Shipment[] = [
  {
    id: '1',
    trackingNumber: 'SHP-2024-001',
    origin: 'Houston, TX',
    destination: 'Dallas, TX',
    status: 'in_transit',
    machineIds: ['M-4521', 'M-4522'],
    departureDate: 'Mar 01, 2024',
    estimatedArrival: 'Mar 03, 2024',
  },
  {
    id: '2',
    trackingNumber: 'SHP-2024-002',
    origin: 'San Antonio, TX',
    destination: 'Austin, TX',
    status: 'pending',
    machineIds: ['M-4523'],
    departureDate: 'Mar 05, 2024',
    estimatedArrival: 'Mar 06, 2024',
  },
  {
    id: '3',
    trackingNumber: 'SHP-2024-003',
    origin: 'Dallas, TX',
    destination: 'Houston, TX',
    status: 'delivered',
    machineIds: ['M-4524', 'M-4525', 'M-4526'],
    departureDate: 'Feb 25, 2024',
    estimatedArrival: 'Feb 27, 2024',
    actualArrival: 'Feb 27, 2024',
  },
  {
    id: '4',
    trackingNumber: 'SHP-2024-004',
    origin: 'El Paso, TX',
    destination: 'Houston, TX',
    status: 'delayed',
    machineIds: ['M-4527'],
    departureDate: 'Feb 28, 2024',
    estimatedArrival: 'Mar 02, 2024',
  },
];

type TabType = 'all' | 'pending' | 'in_transit' | 'delivered';

const tabs: { key: TabType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
];

interface ShipmentListScreenProps {
  onShipmentPress?: (shipment: Shipment) => void;
  onAddPress?: () => void;
  onBackPress?: () => void;
}

export const ShipmentListScreen: React.FC<ShipmentListScreenProps> = ({
  onShipmentPress,
  onAddPress,
  onBackPress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const filteredShipments = sampleShipments.filter((shipment) => {
    const matchesSearch =
      shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.destination.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'all' || shipment.status === activeTab;

    return matchesSearch && matchesTab;
  });

  const getTabCount = (tab: TabType) => {
    if (tab === 'all') return sampleShipments.length;
    return sampleShipments.filter((s) => s.status === tab).length;
  };

  const renderShipment = ({ item }: { item: Shipment }) => (
    <ShipmentCard shipment={item} onPress={() => onShipmentPress?.(item)} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Shipments"
        subtitle={`${sampleShipments.length} total shipments`}
        showBack
        onBackPress={onBackPress}
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search shipments..."
          showFilter={false}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                {getTabCount(tab.key)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Shipment List */}
      <FlatList
        data={filteredShipments}
        renderItem={renderShipment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="truck-remove"
            title="No shipments found"
            description="Try adjusting your search or filters"
          />
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        onPress={() => onAddPress?.()}
        style={styles.fab}
        backgroundColor={Colors.secondary}
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabBadge: {
    marginLeft: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundInput,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tabBadgeTextActive: {
    color: Colors.white,
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

export default ShipmentListScreen;
