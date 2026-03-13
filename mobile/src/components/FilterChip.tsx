import React from 'react';
import { StyleSheet, Pressable, Text, View, ScrollView, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
  count?: number;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  onPress,
  icon,
  count,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={16}
          color={selected ? Colors.white : Colors.textSecondary}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {count !== undefined && (
        <View style={[styles.count, selected && styles.countSelected]}>
          <Text style={[styles.countText, selected && styles.countTextSelected]}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
};

interface FilterChipGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
  horizontal?: boolean;
}

export const FilterChipGroup: React.FC<FilterChipGroupProps> = ({
  children,
  style,
  horizontal = true,
}) => {
  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.horizontalGroup, style]}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.group, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipPressed: {
    opacity: 0.8,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  labelSelected: {
    color: Colors.white,
  },
  count: {
    marginLeft: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundInput,
    minWidth: 20,
    alignItems: 'center',
  },
  countSelected: {
    backgroundColor: Colors.primaryLight,
  },
  countText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  countTextSelected: {
    color: Colors.white,
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  horizontalGroup: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});

export default FilterChip;
