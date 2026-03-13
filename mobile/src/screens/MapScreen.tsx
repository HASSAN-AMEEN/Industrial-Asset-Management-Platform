import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../utils/theme';
import { Card, StatusBadge } from '../components';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Installation, InstallationType } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sample installations data
const installations: Installation[] = [
  {
    id: '1',
    name: 'Houston Facility',
    type: 'active',
    machineCount: 45,
    address: '1234 Industrial Blvd, Houston, TX',
    coordinates: { latitude: 29.7604, longitude: -95.3698 },
    manager: 'John Smith',
  },
  {
    id: '2',
    name: 'Dallas Warehouse',
    type: 'active',
    machineCount: 32,
    address: '5678 Commerce St, Dallas, TX',
    coordinates: { latitude: 32.7767, longitude: -96.797 },
    manager: 'Sarah Johnson',
  },
  {
    id: '3',
    name: 'Austin Site',
    type: 'maintenance',
    machineCount: 18,
    address: '910 Tech Pkwy, Austin, TX',
    coordinates: { latitude: 30.2672, longitude: -97.7431 },
    manager: 'Mike Brown',
  },
  {
    id: '4',
    name: 'San Antonio Hub',
    type: 'active',
    machineCount: 28,
    address: '2468 River Walk, San Antonio, TX',
    coordinates: { latitude: 29.4241, longitude: -98.4936 },
    manager: 'Lisa Davis',
  },
];

const typeConfig: Record<InstallationType, { color: string; label: string }> = {
  active: { color: Colors.success, label: 'Active' },
  maintenance: { color: Colors.warning, label: 'Maintenance' },
  offline: { color: Colors.error, label: 'Offline' },
};

interface MapScreenProps {
  onBackPress?: () => void;
  onInstallationPress?: (installation: Installation) => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  onBackPress,
  onInstallationPress,
}) => {
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const toggleSheet = () => {
    Animated.spring(sheetAnim, {
      toValue: sheetExpanded ? 0 : 1,
      useNativeDriver: true,
    }).start();
    setSheetExpanded(!sheetExpanded);
  };

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.4, 0],
  });

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          {/* Grid Pattern */}
          <View style={styles.gridPattern}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={`h-${i}`} style={[styles.gridLineH, { top: `${i * 5}%` }]} />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={`v-${i}`} style={[styles.gridLineV, { left: `${i * 5}%` }]} />
            ))}
          </View>

          {/* Map Pins */}
          {installations.map((installation, index) => (
            <Pressable
              key={installation.id}
              style={[
                styles.mapPin,
                {
                  top: `${20 + index * 15}%`,
                  left: `${15 + index * 20}%`,
                },
              ]}
              onPress={() => {
                setSelectedInstallation(installation);
                onInstallationPress?.(installation);
              }}
            >
              <View
                style={[
                  styles.pinHead,
                  { backgroundColor: typeConfig[installation.type].color },
                  selectedInstallation?.id === installation.id && styles.pinHeadSelected,
                ]}
              >
                <Icon name="office-building" size={16} color={Colors.white} />
              </View>
              <View
                style={[
                  styles.pinTail,
                  { borderTopColor: typeConfig[installation.type].color },
                ]}
              />
            </Pressable>
          ))}

          {/* Map Label */}
          <Text style={styles.mapLabel}>Interactive Map</Text>
        </View>

        {/* Floating Header */}
        <SafeAreaView style={styles.floatingHeader} edges={['top']}>
          <Pressable onPress={onBackPress} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Installations</Text>
            <Text style={styles.headerSubtitle}>{installations.length} locations</Text>
          </View>
          <Pressable style={styles.layerButton}>
            <Icon name="layers" size={24} color={Colors.textPrimary} />
          </Pressable>
        </SafeAreaView>

        {/* Legend */}
        <View style={styles.legend}>
          {Object.entries(typeConfig).map(([key, config]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: config.color }]} />
              <Text style={styles.legendText}>{config.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <Pressable onPress={toggleSheet} style={styles.sheetHandle}>
          <View style={styles.handleBar} />
          <Text style={styles.sheetTitle}>Nearby Installations</Text>
        </Pressable>

        <ScrollView
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {installations.map((installation) => (
            <Pressable
              key={installation.id}
              style={[
                styles.installationCard,
                selectedInstallation?.id === installation.id && styles.installationCardSelected,
              ]}
              onPress={() => setSelectedInstallation(installation)}
            >
              <View
                style={[
                  styles.installationIcon,
                  { backgroundColor: `${typeConfig[installation.type].color}20` },
                ]}
              >
                <Icon
                  name="office-building"
                  size={20}
                  color={typeConfig[installation.type].color}
                />
              </View>
              <View style={styles.installationInfo}>
                <Text style={styles.installationName}>{installation.name}</Text>
                <Text style={styles.installationAddress}>{installation.address}</Text>
                <View style={styles.installationMeta}>
                  <Icon name="cog" size={14} color={Colors.textMuted} />
                  <Text style={styles.installationMetaText}>
                    {installation.machineCount} machines
                  </Text>
                </View>
              </View>
              <StatusBadge
                status={installation.type === 'active' ? 'active' : 'maintenance'}
                size="sm"
                showDot={false}
              />
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.backgroundElevated,
    position: 'relative',
    overflow: 'hidden',
  },
  gridPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.3,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.border,
    opacity: 0.3,
  },
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinHead: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  pinHeadSelected: {
    transform: [{ scale: 1.2 }],
    borderWidth: 3,
    borderColor: Colors.white,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  mapLabel: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.45,
    alignSelf: 'center',
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  layerButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  legend: {
    position: 'absolute',
    top: 120,
    right: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  legendText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  sheetTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sheetContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  installationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.transparent,
  },
  installationCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  installationIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  installationInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  installationName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  installationAddress: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  installationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  installationMetaText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
});

export default MapScreen;
