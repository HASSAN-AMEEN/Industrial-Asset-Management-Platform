import React from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BorderRadius, Colors, FontSizes, Spacing } from '../utils/theme';
import { useAuth } from '../store/AuthContext';
import { useDrawer } from '../store/DrawerContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  WAREHOUSE_MANAGER: 'Warehouse Manager',
  SALES_OPS: 'Sales / Ops',
  TECHNICIAN: 'Technician',
};

interface AppDrawerProps {
  /** Navigate to a root stack route (provided by the navigator via a ref). */
  navigate: (route: string) => void;
}

/**
 * App-wide right-side slide-in menu. Holds what used to be the Settings screen:
 * profile info, User Management (Super Admin only), and Log Out.
 */
export const AppDrawer: React.FC<AppDrawerProps> = ({ navigate }) => {
  const { isOpen, close } = useDrawer();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const slide = React.useRef(new Animated.Value(PANEL_WIDTH)).current;
  const [mounted, setMounted] = React.useState(false);

  // Fade the backdrop in/out together with the panel slide.
  const backdropOpacity = slide.interpolate({
    inputRange: [0, PANEL_WIDTH],
    outputRange: [1, 0],
  });

  React.useEffect(() => {
    if (isOpen) {
      setMounted(true);
      Animated.timing(slide, { toValue: 0, duration: 240, useNativeDriver: true }).start();
    } else {
      Animated.timing(slide, { toValue: PANEL_WIDTH, duration: 200, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [isOpen, slide]);

  if (!mounted) return null;

  const isAdmin = user?.role === 'SUPER_ADMIN';
  const initials = user?.email ? user.email.split('@')[0].slice(0, 2).toUpperCase() : 'U';
  const roleLabel = user?.role ? ROLE_LABELS[user.role] ?? user.role : 'User';

  const go = (route: string) => {
    close();
    // Navigate after the close animation so the transition is smooth.
    setTimeout(() => navigate(route), 210);
  };

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <View style={styles.overlay}>
        <AnimatedPressable style={[styles.backdrop, { opacity: backdropOpacity }]} onPress={close} />
        <Animated.View style={[styles.panel, { width: PANEL_WIDTH, transform: [{ translateX: slide }] }]}>
          <View
            style={[
              styles.panelInner,
              { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.md },
            ]}
          >
            {/* Profile */}
            <View style={styles.profile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email ?? 'Unknown'}
              </Text>
              <View style={styles.roleBadge}>
                <Icon name="shield-account" size={13} color={Colors.primary} />
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>
              {!!user?.contact && (
                <View style={styles.contactRow}>
                  <Icon name="phone-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.contactText}>{user.contact}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Menu items */}
            <View style={styles.items}>
              {isAdmin && (
                <Pressable style={styles.item} onPress={() => go('UserManagement')}>
                  <Icon name="account-group" size={22} color={Colors.accent} />
                  <Text style={styles.itemText}>User Management</Text>
                  <Icon name="chevron-right" size={20} color={Colors.textMuted} />
                </Pressable>
              )}
            </View>

            <View style={styles.footer}>
              <Pressable style={styles.logoutButton} onPress={() => { close(); logout(); }}>
                <Icon name="logout" size={20} color={Colors.error} />
                <Text style={styles.logoutText}>Log Out</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: Colors.overlay },
  panel: {
    backgroundColor: Colors.backgroundElevated,
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
  },
  panelInner: { flex: 1, paddingHorizontal: Spacing.lg },
  profile: { alignItems: 'center', paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { color: Colors.white, fontSize: FontSizes.xl, fontWeight: '700' },
  email: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: '600', maxWidth: '100%' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary}15`,
  },
  roleBadgeText: { color: Colors.primary, fontSize: FontSizes.xs, fontWeight: '700' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm },
  contactText: { color: Colors.textSecondary, fontSize: FontSizes.xs },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  items: { flex: 1, paddingTop: Spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  itemText: { flex: 1, color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: '500' },
  footer: { paddingBottom: Spacing.md },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.error}40`,
    backgroundColor: `${Colors.error}10`,
  },
  logoutText: { color: Colors.error, fontSize: FontSizes.md, fontWeight: '600' },
});

export default AppDrawer;
