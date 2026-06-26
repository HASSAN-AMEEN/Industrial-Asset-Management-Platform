import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, EmptyState, FAB, FilterChip, Header, Input, SearchBar } from '../components';
import trainingService, { TrainingMaterial, TrainingMaterialType } from '../services/training';
import { useAuth } from '../store/AuthContext';
import { useDrawer } from '../store/DrawerContext';
import { BorderRadius, Colors, FontSizes, Spacing } from '../utils/theme';
import { RootStackParamList } from '../types';

type UploadType = 'VIDEO' | 'PDF';

type FormState = {
  type: UploadType;
  title: string;
  machineModel: string;
  videoUrl: string;
  description: string;
  thumbnailUrl: string;
  pdfFileUri: string;
  pdfFileName: string;
  pdfFileSize: number;
};

type FormErrors = Partial<Record<keyof FormState, string>> & { submit?: string };

const initialForm: FormState = {
  type: 'VIDEO',
  title: '',
  machineModel: '',
  videoUrl: '',
  description: '',
  thumbnailUrl: '',
  pdfFileUri: '',
  pdfFileName: '',
  pdfFileSize: 0,
};

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i;

const extractYouTubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url.trim());

    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '').split('?')[0] || null;
    }

    if (parsed.hostname.includes('youtube.com')) {
      const fromQuery = parsed.searchParams.get('v');
      if (fromQuery) return fromQuery;

      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const embedIndex = pathParts.findIndex((part) => part === 'embed' || part === 'shorts');
      if (embedIndex >= 0 && pathParts[embedIndex + 1]) {
        return pathParts[embedIndex + 1];
      }
    }

    return null;
  } catch {
    return null;
  }
};

const showDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString();
};

const getThumbnailSource = (item: TrainingMaterial) => {
  if (item.type === 'PDF') {
    return null;
  }

  if (item.thumbnailUrl) {
    return { uri: item.thumbnailUrl };
  }

  const videoId = extractYouTubeVideoId(item.videoUrl || '');
  return videoId ? { uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` } : null;
};

const getTypeLabel = (type: TrainingMaterialType) => (type === 'VIDEO' ? 'VIDEO' : 'PDF');

export const TrainingLibraryScreen: React.FC = () => {
  const { user } = useAuth();
  const { open: openDrawer } = useDrawer();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [materials, setMaterials] = React.useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'ALL' | TrainingMaterialType>('ALL');
  const [machineModelFilter, setMachineModelFilter] = React.useState('ALL');
  const [machineModelModalVisible, setMachineModelModalVisible] = React.useState(false);

  const machineModelOptions = React.useMemo(() => {
    const unique = new Set(materials.map((item) => item.machineModel.trim()).filter(Boolean));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [materials]);

  const filteredMaterials = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return materials.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.machineModel.toLowerCase().includes(query);

      const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
      const matchesModel = machineModelFilter === 'ALL' || item.machineModel === machineModelFilter;

      return matchesSearch && matchesType && matchesModel;
    });
  }, [materials, search, typeFilter, machineModelFilter]);

  const hasActiveFilters =
    search.trim().length > 0 || typeFilter !== 'ALL' || machineModelFilter !== 'ALL';

  const showToast = React.useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 2200);
  }, []);

  const loadMaterials = React.useCallback(async () => {
    try {
      setError(null);
      const list = await trainingService.list();
      setMaterials(list);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load training materials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMaterials();
  };

  const resetForm = () => {
    setForm(initialForm);
    setFormErrors({});
    setUploadProgress(0);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setMachineModelFilter('ALL');
  };

  const openModal = () => {
    if (!isSuperAdmin) return;
    resetForm();
    setModalVisible(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalVisible(false);
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key] || formErrors.submit) {
      setFormErrors((prev) => ({ ...prev, [key]: undefined, submit: undefined }));
    }
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.title.trim()) {
      next.title = 'Title is required';
    }

    if (!form.machineModel.trim()) {
      next.machineModel = 'Machine Model is required';
    }

    if (form.type === 'VIDEO') {
      if (!form.videoUrl.trim()) {
        next.videoUrl = 'YouTube URL is required';
      } else if (!YOUTUBE_REGEX.test(form.videoUrl.trim()) || !extractYouTubeVideoId(form.videoUrl.trim())) {
        next.videoUrl = 'Enter a valid YouTube URL';
      }
    }

    if (form.type === 'PDF') {
      if (!form.pdfFileUri || !form.pdfFileName) {
        next.pdfFileUri = 'PDF file is required';
      }

      if (form.pdfFileSize > 20 * 1024 * 1024) {
        next.pdfFileUri = 'PDF size must be 20MB or less';
      }
    }

    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const file = result.assets[0];
      if (file.mimeType && file.mimeType !== 'application/pdf') {
        setFormErrors((prev) => ({ ...prev, pdfFileUri: 'Only PDF files are allowed' }));
        return;
      }

      if ((file.size || 0) > 20 * 1024 * 1024) {
        setFormErrors((prev) => ({ ...prev, pdfFileUri: 'PDF size must be 20MB or less' }));
        return;
      }

      updateField('pdfFileUri', file.uri);
      updateField('pdfFileName', file.name || 'training-material.pdf');
      updateField('pdfFileSize', file.size || 0);
    } catch {
      setFormErrors((prev) => ({ ...prev, pdfFileUri: 'Failed to pick file. Try again.' }));
    }
  };

  const submit = async () => {
    if (!isSuperAdmin) {
      setFormErrors({ submit: 'Only Super Admin can upload training materials.' });
      return;
    }

    if (!validate()) return;

    setSubmitting(true);
    setUploadProgress(0);

    try {
      if (form.type === 'VIDEO') {
        const videoId = extractYouTubeVideoId(form.videoUrl.trim());
        const autoThumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';

        await trainingService.createVideo({
          title: form.title.trim(),
          machineModel: form.machineModel.trim(),
          videoUrl: form.videoUrl.trim(),
          description: form.description.trim() || undefined,
          thumbnailUrl: form.thumbnailUrl.trim() || autoThumb || undefined,
        });
      } else {
        await trainingService.createPdf(
          {
            title: form.title.trim(),
            machineModel: form.machineModel.trim(),
            description: form.description.trim() || undefined,
            fileUri: form.pdfFileUri,
            fileName: form.pdfFileName,
            fileType: 'application/pdf',
          },
          (progress) => setUploadProgress(progress)
        );
      }

      setModalVisible(false);
      resetForm();
      await loadMaterials();
      showToast('Training material added successfully');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to submit material';
      setFormErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = (item: TrainingMaterial) => {
    if (!isSuperAdmin) return;

    Alert.alert(
      'Delete training material',
      'Are you sure you want to delete this material? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await trainingService.remove(item.id);
              await loadMaterials();
              showToast('Training material deleted successfully');
            } catch (deleteError) {
              Alert.alert(
                'Error',
                deleteError instanceof Error ? deleteError.message : 'Failed to delete material'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Header
        title="Training Hub"
        subtitle={isSuperAdmin ? 'Manage and upload learning materials' : 'Browse training materials'}
        showMenu
        onMenuPress={openDrawer}
      />

      {toastMessage ? (
        <View style={styles.toast}>
          <Icon name="check-circle" size={16} color={Colors.white} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <View style={styles.filtersSection}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by title or machine model"
          showFilter={false}
        />

        <View style={styles.chipRow}>
          <FilterChip label="All" selected={typeFilter === 'ALL'} onPress={() => setTypeFilter('ALL')} icon="shape-outline" />
          <FilterChip label="Videos" selected={typeFilter === 'VIDEO'} onPress={() => setTypeFilter('VIDEO')} icon="youtube" />
          <FilterChip label="PDFs" selected={typeFilter === 'PDF'} onPress={() => setTypeFilter('PDF')} icon="file-pdf-box" />
        </View>

        <View style={styles.dropdownSection}>
          <Text style={styles.sectionLabel}>Machine Model</Text>
          <Pressable
            onPress={() => setMachineModelModalVisible(true)}
            style={({ pressed }) => [styles.dropdownTrigger, pressed && styles.dropdownPressed]}
          >
            <Text style={[styles.dropdownValue, machineModelFilter === 'ALL' && styles.dropdownPlaceholder]} numberOfLines={1}>
              {machineModelFilter === 'ALL' ? 'All' : machineModelFilter}
            </Text>
            <Icon name="chevron-down" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Button title="Clear filters" variant="outline" size="sm" onPress={clearFilters} disabled={!hasActiveFilters} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading training materials...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" onPress={loadMaterials} size="sm" />
        </View>
      ) : filteredMaterials.length === 0 ? (
        <EmptyState
          title="No training materials found"
          description={
            hasActiveFilters
              ? 'Try clearing the filters or search with a different term.'
              : 'Training materials will appear here once they are added.'
          }
          icon="school-outline"
        />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {filteredMaterials.map((item) => {
            const isVideo = item.type === 'VIDEO';
            const thumbnail = getThumbnailSource(item);

            return (
              <Card
                key={item.id}
                style={styles.card}
                padding="none"
                onPress={() => navigation.navigate('TrainingDetail', { id: item.id })}
              >
                <View style={styles.mediaWrap}>
                  {thumbnail ? (
                    <Image source={thumbnail} style={styles.media} resizeMode="cover" />
                  ) : (
                    <View style={styles.pdfMedia}>
                      <Icon name="file-pdf-box" size={44} color={Colors.info} />
                    </View>
                  )}

                  <View style={[styles.typeBadge, isVideo ? styles.videoBadge : styles.pdfBadge]}>
                    <Text style={styles.typeBadgeText}>{getTypeLabel(item.type)}</Text>
                  </View>

                  {isSuperAdmin ? (
                    <Pressable style={styles.deleteButton} onPress={() => onDelete(item)}>
                      <Icon name="delete-outline" size={20} color={Colors.error} />
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.modelTag}>
                      <Text style={styles.modelTagText} numberOfLines={1}>
                        {item.machineModel}
                      </Text>
                    </View>
                  </View>

                  {item.description ? (
                    <Text style={styles.description} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : (
                    <Text style={styles.descriptionMuted} numberOfLines={1}>
                      No description provided
                    </Text>
                  )}

                  <Text style={styles.meta}>Uploaded {showDate(item.createdAt)}</Text>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Material</Text>
              <Pressable onPress={closeModal} disabled={submitting}>
                <Icon name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>Step 1 - Select Type</Text>
              <View style={styles.typeSelectRow}>
                {(['VIDEO', 'PDF'] as UploadType[]).map((value) => (
                  <Pressable
                    key={value}
                    style={[styles.typeSelect, form.type === value && styles.typeSelectActive]}
                    onPress={() => {
                      updateField('type', value);
                      setFormErrors({});
                    }}
                  >
                    <Text style={[styles.typeSelectText, form.type === value && styles.typeSelectTextActive]}>
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label="Title *"
                value={form.title}
                onChangeText={(value) => updateField('title', value)}
                error={formErrors.title}
                placeholder="Enter material title"
              />

              <Input
                label="Machine Model *"
                value={form.machineModel}
                onChangeText={(value) => updateField('machineModel', value)}
                error={formErrors.machineModel}
                placeholder="e.g. XCMG-Loader-3000"
              />

              {machineModelOptions.length > 0 ? (
                <View style={styles.suggestionWrap}>
                  <Text style={styles.suggestionLabel}>Existing models</Text>
                  <View style={styles.suggestionRow}>
                    {machineModelOptions.slice(0, 8).map((model) => (
                      <Pressable
                        key={model}
                        style={styles.suggestionChip}
                        onPress={() => updateField('machineModel', model)}
                      >
                        <Text style={styles.suggestionChipText}>{model}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              {form.type === 'VIDEO' ? (
                <>
                  <Input
                    label="YouTube URL *"
                    value={form.videoUrl}
                    onChangeText={(value) => updateField('videoUrl', value)}
                    error={formErrors.videoUrl}
                    placeholder="https://www.youtube.com/watch?v=..."
                    autoCapitalize="none"
                  />

                  <Input
                    label="Thumbnail URL (optional)"
                    value={form.thumbnailUrl}
                    onChangeText={(value) => updateField('thumbnailUrl', value)}
                    placeholder="Auto-generated from YouTube URL if empty"
                    autoCapitalize="none"
                  />
                </>
              ) : (
                <View style={styles.pdfBlock}>
                  <Text style={styles.fieldLabel}>PDF File *</Text>
                  <Button
                    title={form.pdfFileName || 'Select PDF File'}
                    onPress={pickPdf}
                    variant="outline"
                    leftIcon="file-pdf-box"
                  />
                  {form.pdfFileSize > 0 ? (
                    <Text style={styles.fileMeta}>
                      {(form.pdfFileSize / (1024 * 1024)).toFixed(2)} MB selected
                    </Text>
                  ) : null}
                  {formErrors.pdfFileUri ? <Text style={styles.inlineError}>{formErrors.pdfFileUri}</Text> : null}

                  {submitting ? (
                    <View style={styles.progressWrap}>
                      <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>Uploading {uploadProgress}%</Text>
                    </View>
                  ) : null}
                </View>
              )}

              <Input
                label="Description (optional)"
                value={form.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="Add context for learners"
                multiline
                numberOfLines={3}
              />

              {formErrors.submit ? <Text style={styles.inlineError}>{formErrors.submit}</Text> : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={closeModal} variant="ghost" disabled={submitting} />
              <Button
                title={submitting ? 'Submitting...' : 'Submit'}
                onPress={submit}
                loading={submitting}
                disabled={submitting}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={machineModelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMachineModelModalVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <Pressable style={styles.pickerBackdrop} onPress={() => setMachineModelModalVisible(false)} />
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Machine Model</Text>

            <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
              <Pressable
                style={styles.pickerItem}
                onPress={() => {
                  setMachineModelFilter('ALL');
                  setMachineModelModalVisible(false);
                }}
              >
                <Text style={styles.pickerItemText}>All</Text>
              </Pressable>

              {machineModelOptions.map((model) => (
                <Pressable
                  key={model}
                  style={styles.pickerItem}
                  onPress={() => {
                    setMachineModelFilter(model);
                    setMachineModelModalVisible(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{model}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Button title="Close" variant="outline" onPress={() => setMachineModelModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {isSuperAdmin && <FAB icon="plus" onPress={openModal} style={styles.fab} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
  },
  toast: {
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toastText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  filtersSection: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dropdownSection: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  dropdownTrigger: {
    minHeight: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  dropdownPressed: {
    backgroundColor: Colors.backgroundHover,
  },
  dropdownValue: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    marginRight: Spacing.sm,
  },
  dropdownPlaceholder: {
    color: Colors.textMuted,
  },
  actionsRow: {
    alignItems: 'flex-start',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  mediaWrap: {
    position: 'relative',
    height: 180,
    backgroundColor: Colors.backgroundElevated,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  pdfMedia: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  videoBadge: {
    backgroundColor: '#B91C1C',
  },
  pdfBadge: {
    backgroundColor: Colors.info,
  },
  typeBadgeText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deleteButton: {
    position: 'absolute',
    right: Spacing.sm,
    bottom: Spacing.sm,
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardBody: {
    padding: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  modelTag: {
    backgroundColor: `${Colors.primary}20`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  modelTagText: {
    color: Colors.primary,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  descriptionMuted: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  meta: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  typeSelectRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeSelect: {
    flex: 1,
    minHeight: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundElevated,
  },
  typeSelectActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}22`,
  },
  typeSelectText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  typeSelectTextActive: {
    color: Colors.primary,
  },
  suggestionWrap: {
    marginBottom: Spacing.sm,
  },
  suggestionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionChipText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  pdfBlock: {
    marginBottom: Spacing.sm,
  },
  fileMeta: {
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
  },
  inlineError: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  progressWrap: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundElevated,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pickerOverlay: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  pickerCard: {
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    maxHeight: '75%',
  },
  pickerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  pickerScroll: {
    maxHeight: 280,
  },
  pickerItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
  },
});

export default TrainingLibraryScreen;
