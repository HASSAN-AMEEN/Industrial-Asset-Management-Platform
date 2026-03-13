import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Card from './Card';
import { User, UserRole } from '../types';

interface UserCardProps {
  user: User;
  onPress?: () => void;
  onMenuPress?: () => void;
}

const roleConfig: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Admin', color: Colors.accent },
  manager: { label: 'Manager', color: Colors.secondary },
  technician: { label: 'Technician', color: Colors.primary },
  viewer: { label: 'Viewer', color: Colors.textMuted },
};

export const UserCard: React.FC<UserCardProps> = ({ user, onPress, onMenuPress }) => {
  const roleInfo = roleConfig[user.role];
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card onPress={onPress} variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: roleInfo.color }]}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}
          {user.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.actions}>
          <View style={[styles.roleBadge, { backgroundColor: `${roleInfo.color}20` }]}>
            <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
          </View>
          {onMenuPress && (
            <Pressable onPress={onMenuPress} style={styles.menuButton}>
              <Icon name="dots-vertical" size={20} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {(user.department || user.lastActive) && (
        <View style={styles.footer}>
          {user.department && (
            <View style={styles.footerItem}>
              <Icon name="office-building" size={14} color={Colors.textMuted} />
              <Text style={styles.footerText}>{user.department}</Text>
            </View>
          )}
          {user.lastActive && (
            <View style={styles.footerItem}>
              <Icon name="clock-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.footerText}>{user.lastActive}</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.backgroundElevated,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  email: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  actions: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  roleText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  menuButton: {
    padding: Spacing.xs,
    marginTop: Spacing.xs,
    marginRight: -Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.lg,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    marginLeft: Spacing.xs,
  },
});

export default UserCard;
