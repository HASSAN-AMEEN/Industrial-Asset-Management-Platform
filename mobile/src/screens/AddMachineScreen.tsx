import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { Header, Input, Button, Card } from '../components';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MachineStatus, MachineFormData } from '../types';

const machineTypes = ['Pump', 'Compressor', 'Generator', 'Press', 'Motor', 'Other'];

const statusOptions: { status: MachineStatus; label: string; icon: string }[] = [
  { status: 'active', label: 'Active', icon: 'check-circle' },
  { status: 'maintenance', label: 'Maintenance', icon: 'wrench' },
  { status: 'transit', label: 'In Transit', icon: 'truck' },
  { status: 'inactive', label: 'Inactive', icon: 'pause-circle' },
];

interface AddMachineScreenProps {
  onBackPress?: () => void;
  onSubmit?: (data: MachineFormData) => void;
}

export const AddMachineScreen: React.FC<AddMachineScreenProps> = ({
  onBackPress,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<MachineFormData>({
    serialNumber: '',
    model: '',
    type: '',
    status: 'active',
    location: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MachineFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const updateField = <K extends keyof MachineFormData>(field: K, value: MachineFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    if (!formData.type) {
      newErrors.type = 'Machine type is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onSubmit?.(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Add Machine"
        showBack
        onBackPress={onBackPress}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Info */}
          <Card variant="elevated" style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <Input
              label="Serial Number"
              placeholder="Enter serial number"
              value={formData.serialNumber}
              onChangeText={(text) => updateField('serialNumber', text)}
              leftIcon="barcode"
              error={errors.serialNumber}
              autoCapitalize="characters"
            />

            <Input
              label="Model"
              placeholder="Enter model name"
              value={formData.model}
              onChangeText={(text) => updateField('model', text)}
              leftIcon="tag"
              error={errors.model}
            />

            {/* Machine Type Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Machine Type</Text>
              <Pressable
                style={[
                  styles.dropdown,
                  showTypeDropdown && styles.dropdownFocused,
                  !!errors.type && styles.dropdownError,
                ]}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <Icon name="cog" size={20} color={Colors.textSecondary} style={styles.dropdownIcon} />
                <Text style={[styles.dropdownText, !formData.type && styles.dropdownPlaceholder]}>
                  {formData.type || 'Select machine type'}
                </Text>
                <Icon
                  name={showTypeDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </Pressable>
              {showTypeDropdown && (
                <View style={styles.dropdownOptions}>
                  {machineTypes.map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.dropdownOption,
                        formData.type === type && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        updateField('type', type);
                        setShowTypeDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          formData.type === type && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                      {formData.type === type && (
                        <Icon name="check" size={18} color={Colors.primary} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
              {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
            </View>
          </Card>

          {/* Status Selection */}
          <Card variant="elevated" style={styles.section}>
            <Text style={styles.sectionTitle}>Initial Status</Text>
            <View style={styles.statusGrid}>
              {statusOptions.map((option) => (
                <Pressable
                  key={option.status}
                  style={[
                    styles.statusOption,
                    formData.status === option.status && styles.statusOptionSelected,
                  ]}
                  onPress={() => updateField('status', option.status)}
                >
                  <Icon
                    name={option.icon}
                    size={24}
                    color={formData.status === option.status ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.statusLabel,
                      formData.status === option.status && styles.statusLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Location */}
          <Card variant="elevated" style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Input
              label="Installation Location"
              placeholder="Enter location or site name"
              value={formData.location}
              onChangeText={(text) => updateField('location', text)}
              leftIcon="map-marker"
              error={errors.location}
            />
          </Card>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              title="Add Machine"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
              leftIcon="plus"
            />
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  dropdownFocused: {
    borderColor: Colors.primary,
  },
  dropdownError: {
    borderColor: Colors.error,
  },
  dropdownIcon: {
    marginRight: Spacing.md,
  },
  dropdownText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  dropdownPlaceholder: {
    color: Colors.textMuted,
  },
  dropdownOptions: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownOptionSelected: {
    backgroundColor: `${Colors.primary}15`,
  },
  dropdownOptionText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  dropdownOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusOptionSelected: {
    backgroundColor: `${Colors.primary}15`,
    borderColor: Colors.primary,
  },
  statusLabel: {
    marginLeft: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusLabelSelected: {
    color: Colors.primary,
  },
  submitContainer: {
    marginTop: Spacing.md,
  },
  bottomPadding: {
    height: 40,
  },
});

export default AddMachineScreen;
