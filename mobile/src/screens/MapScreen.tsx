import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Region, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, Header, Input, SearchBar, StatusBadge } from '../components';
import installationService, { InstallationMapItem, InstallationUnmappedItem } from '../services/installation';
import { useDrawer } from '../store/DrawerContext';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../utils/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DEFAULT_REGION: Region = {
  latitude: 24.8607,
  longitude: 67.0011,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

// Leave room for the collapsed bottom sheet when fitting markers into view.
const MAP_EDGE_PADDING = { top: 90, right: 70, bottom: 260, left: 70 };

type StatusFilter = 'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'REMOVED';

const statusFilters: StatusFilter[] = ['ALL', 'ACTIVE', 'MAINTENANCE', 'REMOVED'];

const datePresets: Array<{ label: string; days: number | null }> = [
  { label: 'All time', days: null },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

const statusColor = (status: InstallationMapItem['status']): string => {
  if (status === 'ACTIVE') return Colors.success;
  if (status === 'MAINTENANCE') return Colors.warning;
  return Colors.textMuted;
};

const isValidDateInput = (value: string): boolean => {
  if (!value.trim()) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
};

const toISODate = (date: Date): string => date.toISOString().slice(0, 10);

const formatDate = (value?: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const buildMapsLink = (lat: number, lng: number): string =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

const buildDirectionsLink = (lat: number, lng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

/**
 * Custom status-coloured map pin. Manages `tracksViewChanges` itself: it renders
 * for a short window after mount / selection change (so the marker bitmap updates),
 * then freezes to keep the map smooth with many markers.
 */
const MapMarker: React.FC<{
  installation: InstallationMapItem;
  selected: boolean;
  onPress: () => void;
}> = ({ installation, selected, onPress }) => {
  const [tracks, setTracks] = React.useState(true);

  React.useEffect(() => {
    setTracks(true);
    const timeout = setTimeout(() => setTracks(false), 700);
    return () => clearTimeout(timeout);
  }, [selected]);

  const color = statusColor(installation.status);

  return (
    <Marker
      coordinate={{ latitude: installation.latitude, longitude: installation.longitude }}
      onPress={onPress}
      tracksViewChanges={tracks}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={selected ? 999 : 1}
    >
      <View style={styles.markerWrap}>
        <View
          style={[
            styles.markerBubble,
            { backgroundColor: color, borderColor: selected ? Colors.white : 'rgba(255,255,255,0.85)' },
            selected && styles.markerBubbleSelected,
          ]}
        >
          <Icon name="cog" size={selected ? 18 : 13} color={Colors.white} />
        </View>
        <View style={[styles.markerTip, { borderTopColor: color }]} />
      </View>
    </Marker>
  );
};

export const MapScreen: React.FC = () => {
  const { open: openDrawer } = useDrawer();
  const mapRef = React.useRef<MapView | null>(null);
  const sheetAnim = React.useRef(new Animated.Value(0)).current;
  const initialLoadRef = React.useRef(true);
  const lastFilterKeyRef = React.useRef('');

  const [sheetExpanded, setSheetExpanded] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL');
  const [cityFilter, setCityFilter] = React.useState<string>('ALL');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  const [mappedInstallations, setMappedInstallations] = React.useState<InstallationMapItem[]>([]);
  const [unmappedInstallations, setUnmappedInstallations] = React.useState<InstallationUnmappedItem[]>([]);
  const [selectedInstallationId, setSelectedInstallationId] = React.useState<string | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isUnmappedLoading, setIsUnmappedLoading] = React.useState(false);
  const [unmappedLoaded, setUnmappedLoaded] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const hasDateError = !isValidDateInput(fromDate) || !isValidDateInput(toDate);

  const openSheet = React.useCallback(() => {
    setSheetExpanded(true);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 60 }).start();
  }, [sheetAnim]);

  const closeSheet = React.useCallback(() => {
    setSheetExpanded(false);
    Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, friction: 8, tension: 60 }).start();
  }, [sheetAnim]);

  const toggleSheet = React.useCallback(() => {
    sheetExpanded ? closeSheet() : openSheet();
  }, [closeSheet, openSheet, sheetExpanded]);

  const animateToInstallation = React.useCallback((installation: InstallationMapItem) => {
    mapRef.current?.animateToRegion(
      {
        latitude: installation.latitude,
        longitude: installation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      350
    );
  }, []);

  const fitToInstallations = React.useCallback((items: InstallationMapItem[]) => {
    if (items.length === 0) return;

    if (items.length === 1) {
      mapRef.current?.animateToRegion(
        { latitude: items[0].latitude, longitude: items[0].longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 },
        350
      );
      return;
    }

    mapRef.current?.fitToCoordinates(
      items.map((item) => ({ latitude: item.latitude, longitude: item.longitude })),
      { edgePadding: MAP_EDGE_PADDING, animated: true }
    );
  }, []);

  const selectInstallation = React.useCallback(
    (installation: InstallationMapItem, options?: { expandSheet?: boolean; animate?: boolean }) => {
      setSelectedInstallationId(installation.id);
      if (options?.expandSheet ?? true) openSheet();
      if (options?.animate ?? true) animateToInstallation(installation);
    },
    [animateToInstallation, openSheet]
  );

  const clearFilters = React.useCallback(() => {
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setCityFilter('ALL');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
  }, []);

  const applyDatePreset = React.useCallback((days: number | null) => {
    if (days === null) {
      setFromDate('');
      setToDate('');
      return;
    }
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - days);
    setFromDate(toISODate(from));
    setToDate(toISODate(now));
  }, []);

  // Filter option lists derived from the loaded data.
  const categoryOptions = React.useMemo(() => {
    const set = new Set(mappedInstallations.map((item) => item.machine.category).filter(Boolean));
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [mappedInstallations]);

  const cityOptions = React.useMemo(() => {
    const set = new Set(
      mappedInstallations.map((item) => item.client?.city).filter((city): city is string => !!city)
    );
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [mappedInstallations]);

  const activeFilterLabels = React.useMemo(() => {
    const labels: string[] = [];
    if (statusFilter !== 'ALL') labels.push(`Status: ${statusFilter}`);
    if (categoryFilter !== 'ALL') labels.push(`Type: ${categoryFilter}`);
    if (cityFilter !== 'ALL') labels.push(`City: ${cityFilter}`);
    if (fromDate.trim()) labels.push(`From ${fromDate.trim()}`);
    if (toDate.trim()) labels.push(`To ${toDate.trim()}`);
    if (searchQuery.trim()) labels.push(`Search: ${searchQuery.trim()}`);
    return labels;
  }, [categoryFilter, cityFilter, fromDate, searchQuery, statusFilter, toDate]);

  const visibleInstallations = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return mappedInstallations.filter((installation) => {
      if (categoryFilter !== 'ALL' && installation.machine.category !== categoryFilter) return false;
      if (cityFilter !== 'ALL' && installation.client?.city !== cityFilter) return false;

      if (!query) return true;

      const fields = [
        installation.machine.serialNumber,
        installation.machine.model,
        installation.machine.category,
        installation.siteAddress,
        installation.client?.name,
        installation.client?.city,
        installation.client?.address,
      ];
      return fields.some((field) => field?.toLowerCase().includes(query));
    });
  }, [categoryFilter, cityFilter, mappedInstallations, searchQuery]);

  const selectedInstallation = React.useMemo(
    () => visibleInstallations.find((item) => item.id === selectedInstallationId) || null,
    [selectedInstallationId, visibleInstallations]
  );

  const loadMappedData = React.useCallback(async () => {
    if (hasDateError) return;
    setErrorMessage(null);

    if (initialLoadRef.current) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const params = {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        fromDate: fromDate.trim() || undefined,
        toDate: toDate.trim() || undefined,
      };

      const mapped = await installationService.listForMap(params);
      setMappedInstallations(mapped);
      setUnmappedInstallations([]);
      setUnmappedLoaded(false);

      if (mapped.length === 0) {
        setSelectedInstallationId(null);
      } else {
        const stillVisible = mapped.find((item) => item.id === selectedInstallationId);
        setSelectedInstallationId(stillVisible ? stillVisible.id : mapped[0].id);
      }

      // Always frame all results so the user sees every pin.
      requestAnimationFrame(() => fitToInstallations(mapped));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load map data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      initialLoadRef.current = false;
    }
  }, [fitToInstallations, fromDate, hasDateError, selectedInstallationId, statusFilter, toDate]);

  const loadUnmappedData = React.useCallback(async () => {
    if (hasDateError || isUnmappedLoading || unmappedLoaded) return;
    setIsUnmappedLoading(true);
    try {
      const params = {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        fromDate: fromDate.trim() || undefined,
        toDate: toDate.trim() || undefined,
      };
      const unmapped = await installationService.listUnmapped(params);
      setUnmappedInstallations(unmapped);
      setUnmappedLoaded(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load unmapped installations');
    } finally {
      setIsUnmappedLoading(false);
    }
  }, [fromDate, hasDateError, isUnmappedLoading, statusFilter, toDate, unmappedLoaded]);

  const filterKey = [statusFilter, fromDate.trim(), toDate.trim()].join('|');

  React.useEffect(() => {
    if (filterKey === lastFilterKeyRef.current) return;
    lastFilterKeyRef.current = filterKey;
    const timeoutId = setTimeout(() => loadMappedData(), 300);
    return () => clearTimeout(timeoutId);
  }, [filterKey, loadMappedData]);

  React.useEffect(() => {
    if (sheetExpanded) loadUnmappedData();
  }, [loadUnmappedData, sheetExpanded]);

  React.useEffect(() => {
    if (visibleInstallations.length === 0) {
      if (selectedInstallationId !== null) setSelectedInstallationId(null);
      return;
    }
    const selectedStillVisible = visibleInstallations.some((item) => item.id === selectedInstallationId);
    if (!selectedStillVisible) setSelectedInstallationId(visibleInstallations[0].id);
  }, [selectedInstallationId, visibleInstallations]);

  const openInMaps = React.useCallback((installation: InstallationMapItem) => {
    Linking.openURL(buildMapsLink(installation.latitude, installation.longitude)).catch(() => undefined);
  }, []);

  const openDirections = React.useCallback((installation: InstallationMapItem) => {
    Linking.openURL(buildDirectionsLink(installation.latitude, installation.longitude)).catch(() => undefined);
  }, []);

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.46, 0],
  });

  const visibleMappedCount = visibleInstallations.length;
  const unmappedCountLabel = unmappedLoaded ? String(unmappedInstallations.length) : '…';

  const renderChipRow = (
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void,
    formatLabel?: (value: string) => string
  ) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      {options.map((option) => {
        const selected = selectedValue === option;
        return (
          <Pressable
            key={option}
            style={[styles.filterChip, selected && styles.filterChipSelected]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
              {formatLabel ? formatLabel(option) : option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Installations Map"
        subtitle={`${visibleMappedCount} mapped • ${unmappedCountLabel} unmapped`}
        showMenu
        onMenuPress={openDrawer}
      />

      <View style={styles.mapArea}>
        <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={DEFAULT_REGION}>
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            shouldReplaceMapContent
          />

          {visibleInstallations.map((installation) => (
            <MapMarker
              key={installation.id}
              installation={installation}
              selected={selectedInstallationId === installation.id}
              onPress={() => selectInstallation(installation)}
            />
          ))}
        </MapView>

        <View style={styles.attributionWrap}>
          <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
        </View>

        {/* Recenter / fit-all control */}
        <Pressable
          style={styles.recenterButton}
          onPress={() => fitToInstallations(visibleInstallations)}
          hitSlop={8}
        >
          <Icon name="image-filter-center-focus" size={22} color={Colors.primary} />
        </Pressable>

        {(isLoading || isRefreshing) && (
          <View style={styles.loadingPill} pointerEvents="none">
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>{isLoading ? 'Loading map data' : 'Refreshing'}</Text>
          </View>
        )}
      </View>

      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetTranslateY }] }]}>
        <Pressable style={styles.sheetHandle} onPress={toggleSheet}>
          <View style={styles.sheetHandleTopRow}>
            <View style={styles.handleBar} />
            <Icon name={sheetExpanded ? 'chevron-down' : 'chevron-up'} size={24} color={Colors.textSecondary} />
          </View>
          <Text style={styles.sheetTitle}>Map Data</Text>
          <Text style={styles.sheetSubtitle}>
            {visibleMappedCount} mapped • {unmappedCountLabel} unmapped • tap a pin for details
          </Text>
        </Pressable>

        <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {selectedInstallation && (
            <View style={styles.selectedCard}>
              <View style={styles.selectedCardHeader}>
                <View style={styles.selectedCardCopy}>
                  <Text style={styles.selectedCardTitle}>
                    {selectedInstallation.machine.serialNumber} • {selectedInstallation.machine.model}
                  </Text>
                  <Text style={styles.selectedCardSubtext} numberOfLines={2}>
                    {selectedInstallation.siteAddress || selectedInstallation.client?.address || 'No site address'}
                  </Text>
                </View>
                <StatusBadge status={selectedInstallation.status} size="sm" showDot={false} />
              </View>

              <View style={styles.selectedCardMetaRow}>
                <View style={styles.metaPill}>
                  <Icon name="tag-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.selectedCardMeta}>{selectedInstallation.machine.category}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Icon name="account-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.selectedCardMeta}>{selectedInstallation.client?.name || 'No client'}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Icon name="calendar-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.selectedCardMeta}>{formatDate(selectedInstallation.installedAt)}</Text>
                </View>
              </View>

              <View style={styles.selectedCardActions}>
                <Button
                  title="Open in Maps"
                  size="sm"
                  leftIcon="map-marker"
                  onPress={() => openInMaps(selectedInstallation)}
                  style={styles.flexButton}
                />
                <Button
                  title="Directions"
                  size="sm"
                  variant="outline"
                  leftIcon="directions"
                  onPress={() => openDirections(selectedInstallation)}
                  style={styles.flexButton}
                />
              </View>
            </View>
          )}

          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search serial, model, client or site"
            showFilter={false}
            style={styles.searchBar}
          />

          {activeFilterLabels.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFilterRow}>
              {activeFilterLabels.map((label) => (
                <View key={label} style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>{label}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <Text style={styles.sectionTitle}>Status</Text>
          {renderChipRow(statusFilters, statusFilter, (value) => setStatusFilter(value as StatusFilter), (value) =>
            value === 'ALL' ? 'All' : value
          )}

          {categoryOptions.length > 1 && (
            <>
              <Text style={styles.sectionTitle}>Machine Type</Text>
              {renderChipRow(categoryOptions, categoryFilter, setCategoryFilter, (value) =>
                value === 'ALL' ? 'All' : value
              )}
            </>
          )}

          {cityOptions.length > 1 && (
            <>
              <Text style={styles.sectionTitle}>City</Text>
              {renderChipRow(cityOptions, cityFilter, setCityFilter, (value) => (value === 'ALL' ? 'All' : value))}
            </>
          )}

          <Text style={styles.sectionTitle}>Installed Date</Text>
          {renderChipRow(
            datePresets.map((preset) => preset.label),
            // Highlight the active preset when the current range matches it.
            datePresets.find((preset) => {
              if (preset.days === null) return !fromDate && !toDate;
              const now = new Date();
              const from = new Date(now);
              from.setDate(now.getDate() - preset.days);
              return fromDate === toISODate(from) && toDate === toISODate(now);
            })?.label ?? '',
            (label) => {
              const preset = datePresets.find((item) => item.label === label);
              if (preset) applyDatePreset(preset.days);
            }
          )}

          <View style={styles.dateRow}>
            <Input
              label="From"
              placeholder="YYYY-MM-DD"
              value={fromDate}
              onChangeText={setFromDate}
              containerStyle={styles.dateInput}
            />
            <Input
              label="To"
              placeholder="YYYY-MM-DD"
              value={toDate}
              onChangeText={setToDate}
              containerStyle={styles.dateInput}
            />
          </View>

          {hasDateError && <Text style={styles.inlineError}>Use YYYY-MM-DD format for date filters.</Text>}

          <Button title="Clear Filters" variant="outline" onPress={clearFilters} style={styles.clearButton} />

          {!!errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Button title="Retry" size="sm" onPress={loadMappedData} />
            </View>
          )}

          <Text style={styles.sectionTitle}>Mapped Installations</Text>
          {visibleInstallations.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <Icon name="map-marker-off" size={20} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No mapped installations found for the current filters.</Text>
            </View>
          ) : (
            visibleInstallations.map((installation) => (
              <Pressable
                key={installation.id}
                style={[
                  styles.installationCard,
                  selectedInstallationId === installation.id && styles.installationCardSelected,
                ]}
                onPress={() => selectInstallation(installation)}
              >
                <View style={[styles.cardDot, { backgroundColor: statusColor(installation.status) }]} />
                <View style={styles.installationInfo}>
                  <Text style={styles.installationTitle}>
                    {installation.machine.serialNumber} • {installation.machine.model}
                  </Text>
                  <Text style={styles.installationSubtext} numberOfLines={1}>
                    {installation.siteAddress || installation.client?.address || 'No site address'}
                  </Text>
                  <Text style={styles.installationSubtext}>Installed: {formatDate(installation.installedAt)}</Text>
                </View>
                <Pressable
                  style={styles.cardMapsButton}
                  onPress={() => openInMaps(installation)}
                  hitSlop={8}
                >
                  <Icon name="map-marker" size={18} color={Colors.primary} />
                </Pressable>
              </Pressable>
            ))
          )}

          <Text style={styles.sectionTitle}>Unmapped Installations</Text>
          {!unmappedLoaded ? (
            <Pressable style={styles.unmappedLoadPrompt} onPress={loadUnmappedData}>
              {isUnmappedLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Icon name="map-search" size={20} color={Colors.primary} />
              )}
              <View style={styles.unmappedLoadCopy}>
                <Text style={styles.unmappedLoadTitle}>Load unmapped list</Text>
                <Text style={styles.unmappedLoadText}>Installations without a location link or coordinates.</Text>
              </View>
            </Pressable>
          ) : unmappedInstallations.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="check-circle-outline" size={20} color={Colors.success} />
              <Text style={styles.emptyText}>All installations are mapped.</Text>
            </View>
          ) : (
            unmappedInstallations.map((installation) => (
              <View key={installation.id} style={styles.unmappedCard}>
                <Text style={styles.installationTitle}>
                  {installation.machine.serialNumber} • {installation.machine.model}
                </Text>
                <Text style={styles.installationSubtext}>
                  {installation.siteAddress || installation.client?.address || 'No site address provided'}
                </Text>
                <Text style={styles.unmappedReason}>Reason: no location link / coordinates</Text>
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  attributionWrap: {
    position: 'absolute',
    left: Spacing.md,
    bottom: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  attributionText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
  },
  recenterButton: {
    position: 'absolute',
    right: Spacing.md,
    bottom: SCREEN_HEIGHT * 0.3,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  markerWrap: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    ...Shadows.sm,
  },
  markerBubbleSelected: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
  },
  markerTip: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  loadingPill: {
    position: 'absolute',
    top: Spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.72,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetHandleTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    marginLeft: 8,
  },
  sheetTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sheetSubtitle: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  selectedCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.primary}08`,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
    marginBottom: Spacing.md,
  },
  selectedCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  selectedCardCopy: {
    flex: 1,
  },
  selectedCardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  selectedCardSubtext: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
  selectedCardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundElevated,
  },
  selectedCardMeta: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  selectedCardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  searchBar: {
    marginBottom: Spacing.md,
  },
  activeFilterRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  activeFilterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary}10`,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
  },
  activeFilterChipText: {
    color: Colors.primary,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
  },
  filterRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: Colors.white,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
  },
  inlineError: {
    marginTop: Spacing.sm,
    color: Colors.error,
    fontSize: FontSizes.sm,
  },
  clearButton: {
    marginTop: Spacing.md,
  },
  errorBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.error}15`,
    borderWidth: 1,
    borderColor: `${Colors.error}40`,
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
  },
  installationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.transparent,
    marginBottom: Spacing.sm,
  },
  installationCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}12`,
  },
  cardDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  installationInfo: {
    flex: 1,
  },
  installationTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  installationSubtext: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    marginBottom: 2,
  },
  cardMapsButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary}12`,
  },
  unmappedCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unmappedLoadPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unmappedLoadCopy: {
    flex: 1,
  },
  unmappedLoadTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  unmappedLoadText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
  },
  unmappedReason: {
    color: Colors.warning,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    flex: 1,
  },
});

export default MapScreen;
