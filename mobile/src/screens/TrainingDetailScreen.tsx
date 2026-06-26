import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card } from '../components';
import trainingService, { TrainingMaterial } from '../services/training';
import { useAuth } from '../store/AuthContext';
import { BorderRadius, Colors, FontSizes, Spacing } from '../utils/theme';
import { RootStackParamList } from '../types';

type TrainingDetailRoute = RouteProp<RootStackParamList, 'TrainingDetail'>;
type TrainingDetailNavigation = NativeStackNavigationProp<RootStackParamList>;

const showDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString();
};

const normalizeUploaderName = (value?: string | null): string => {
  if (!value) return 'Unknown user';

  const localPart = value.includes('@') ? value.split('@')[0] : value;
  const readable = localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!readable) return value;

  return readable
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

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

const buildVideoThumbnail = (material?: TrainingMaterial | null): string | null => {
  if (!material) return null;
  if (material.thumbnailUrl) return material.thumbnailUrl;

  const videoId = extractYouTubeVideoId(material.videoUrl || '');
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

export const TrainingDetailScreen: React.FC = () => {
  const navigation = useNavigation<TrainingDetailNavigation>();
  const route = useRoute<TrainingDetailRoute>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [material, setMaterial] = React.useState<TrainingMaterial | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const [videoLoading, setVideoLoading] = React.useState(true);
  const [videoError, setVideoError] = React.useState(false);
  const [videoKey, setVideoKey] = React.useState(0);

  const [pdfLoading, setPdfLoading] = React.useState(true);
  const [pdfError, setPdfError] = React.useState(false);
  const [pdfKey, setPdfKey] = React.useState(0);

  const loadMaterial = React.useCallback(async () => {
    try {
      setError(null);
      const result = await trainingService.getById(route.params.id);
      setMaterial(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load training material');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route.params.id]);

  React.useEffect(() => {
    loadMaterial();
  }, [loadMaterial]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMaterial();
  };

  const goBackToLibrary = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Main', { screen: 'Training' } as never);
  }, [navigation]);

  const retryLoad = () => {
    setLoading(true);
    loadMaterial();
  };

  const handleDelete = () => {
    if (!isSuperAdmin || !material) return;

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
              setActionLoading(true);
              await trainingService.remove(material.id);
              goBackToLibrary();
            } catch (deleteError) {
              Alert.alert(
                'Error',
                deleteError instanceof Error ? deleteError.message : 'Failed to delete training material'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const openPdfInBrowser = async () => {
    if (!material?.pdfUrl) return;
    try {
      await Linking.openURL(material.pdfUrl);
    } catch {
      Alert.alert('Error', 'Could not open the PDF in your browser.');
    }
  };

  const retryVideo = () => {
    setVideoError(false);
    setVideoLoading(true);
    setVideoKey((current) => current + 1);
  };

  const retryPdf = () => {
    setPdfError(false);
    setPdfLoading(true);
    setPdfKey((current) => current + 1);
  };

  const machineModelTag = material?.machineModel || '';
  const uploaderName = normalizeUploaderName(material?.users?.email || material?.uploadedBy);
  const uploadedOn = material ? showDate(material.createdAt) : '';
  const videoId = material?.videoUrl ? extractYouTubeVideoId(material.videoUrl) : null;
  const pdfUrl = material?.pdfUrl || null;
  const viewerWidth = Math.min(width - Spacing.lg * 2, 960);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.centerState, { paddingTop: insets.top + Spacing.xl }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading training material...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !material) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.detailHeader}>
          <Pressable onPress={goBackToLibrary} style={styles.backButton} hitSlop={10}>
            <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Training Hub
          </Text>
          <View style={styles.headerActionSpacer} />
        </View>

        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>{error || 'Training material not found'}</Text>
          <Button title="Retry" onPress={retryLoad} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.detailHeader}>
        <Pressable onPress={goBackToLibrary} style={styles.backButton} hitSlop={10}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {material.title}
        </Text>

        {isSuperAdmin ? (
          <Pressable onPress={handleDelete} style={styles.deleteButton} disabled={actionLoading} hitSlop={10}>
            <Icon name="delete-outline" size={24} color={Colors.error} />
          </Pressable>
        ) : (
          <View style={styles.headerActionSpacer} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {material.type === 'PDF' ? (
          <>
            <Card style={styles.metaCard}>
              <Text style={styles.title}>{material.title}</Text>
              <View style={styles.tagRow}>
                <View style={styles.modelTag}>
                  <Text style={styles.modelTagText} numberOfLines={1}>
                    {machineModelTag}
                  </Text>
                </View>
              </View>

              {material.description ? (
                <Text style={styles.description}>{material.description}</Text>
              ) : (
                <Text style={styles.descriptionMuted}>No description provided.</Text>
              )}
            </Card>

            <Card style={styles.viewerCard} padding="none">
              {pdfLoading && !pdfError ? (
                <View style={styles.viewerLoading}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.viewerLoadingText}>Loading PDF...</Text>
                </View>
              ) : null}

              {pdfError || !pdfUrl ? (
                <View style={styles.viewerErrorWrap}>
                  <Text style={styles.viewerErrorText}>Could not load PDF. Try downloading it instead.</Text>
                  <View style={styles.viewerActions}>
                    <Button title="Download PDF" onPress={openPdfInBrowser} leftIcon="download" />
                    <Button title="Retry" variant="outline" onPress={retryPdf} />
                  </View>
                </View>
              ) : (
                <WebView
                  key={pdfKey}
                  source={{ uri: pdfUrl }}
                  style={[styles.webView, { height: Math.max(520, viewerWidth * 1.25) }]}
                  startInLoadingState
                  renderLoading={() => (
                    <View style={styles.viewerLoading}>
                      <ActivityIndicator size="large" color={Colors.primary} />
                      <Text style={styles.viewerLoadingText}>Loading PDF...</Text>
                    </View>
                  )}
                  onLoadStart={() => {
                    setPdfError(false);
                    setPdfLoading(true);
                  }}
                  onLoadEnd={() => setPdfLoading(false)}
                  onError={() => {
                    setPdfLoading(false);
                    setPdfError(true);
                  }}
                  originWhitelist={['*']}
                />
              )}
            </Card>

            <View style={styles.footerMeta}>
              <Text style={styles.uploadedText}>
                Uploaded by {uploaderName} on {uploadedOn}
              </Text>
              <Button title="Download PDF" onPress={openPdfInBrowser} leftIcon="download" variant="outline" />
            </View>
          </>
        ) : (
          <>
            <Card style={styles.mediaCard} padding="none">
              {videoLoading && !videoError ? (
                <View style={styles.viewerLoading}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.viewerLoadingText}>Loading video...</Text>
                </View>
              ) : null}

              {videoError || !videoId ? (
                <View style={styles.viewerErrorWrap}>
                  <Text style={styles.viewerErrorText}>Video unavailable. Please check the URL.</Text>
                  <Button title="Retry" variant="outline" onPress={retryVideo} />
                </View>
              ) : (
                <YoutubePlayer
                  key={videoKey}
                  height={Math.max(220, Math.min(320, width * 0.56))}
                  play
                  videoId={videoId}
                  initialPlayerParams={{
                    controls: true,
                    modestbranding: true,
                    rel: false,
                    autoplay: true,
                  }}
                  onReady={() => setVideoLoading(false)}
                  onError={() => {
                    setVideoLoading(false);
                    setVideoError(true);
                  }}
                />
              )}
            </Card>

            <Card style={styles.metaCard}>
              <Text style={styles.title}>{material.title}</Text>
              <View style={styles.tagRow}>
                <View style={styles.modelTag}>
                  <Text style={styles.modelTagText} numberOfLines={1}>
                    {machineModelTag}
                  </Text>
                </View>
              </View>

              {material.description ? (
                <Text style={styles.description}>{material.description}</Text>
              ) : (
                <Text style={styles.descriptionMuted}>No description provided.</Text>
              )}
            </Card>

            <View style={styles.footerMeta}>
              <Text style={styles.uploadedText}>
                Uploaded by {uploaderName} on {uploadedOn}
              </Text>
            </View>
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
  detailHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerActionSpacer: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  metaCard: {
    gap: Spacing.sm,
  },
  mediaCard: {
    overflow: 'hidden',
  },
  viewerCard: {
    overflow: 'hidden',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    lineHeight: 30,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
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
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  descriptionMuted: {
    color: Colors.textMuted,
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  viewerLoading: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.backgroundElevated,
  },
  viewerLoadingText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
  webView: {
    backgroundColor: Colors.backgroundElevated,
  },
  viewerErrorWrap: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundElevated,
  },
  viewerErrorText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  viewerActions: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerMeta: {
    gap: Spacing.md,
  },
  uploadedText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
});

export default TrainingDetailScreen;
