import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { RootStackParamList, MainTabParamList } from '../types';
import { useAuth } from '../store/AuthContext';
import { BackendAuthRole } from '../services/auth';
import AppDrawer from '../components/AppDrawer';

// Screens
import {
  LoginScreen,
  SignupScreen,
  DashboardScreen,
  MachineListScreen,
  MachineDetailScreen,
  ShipmentListScreen,
  MapScreen,
  AddMachineScreen,
  TrainingLibraryScreen,
  TrainingDetailScreen,
  WarehouseManagementScreen,
  UserManagementScreen,
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Dark theme for navigation
const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.background,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.error,
  },
};

// Per-role tab visibility, derived from the SRD permission matrix.
// Keep order consistent so the bottom bar lays out the same shape for everyone.
type TabName = keyof MainTabParamList;

interface TabDef {
  name: TabName;
  component: React.ComponentType<any>;
  icon: string;
  label: string;
  roles: BackendAuthRole[];
}

const ALL_TABS: TabDef[] = [
  {
    name: 'Dashboard',
    component: DashboardScreen,
    icon: 'view-dashboard',
    label: 'Home',
    roles: ['SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OPS', 'TECHNICIAN'],
  },
  {
    name: 'Machines',
    component: MachineListScreen,
    icon: 'cog',
    label: 'Machines',
    roles: ['SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OPS'],
  },
  {
    name: 'Shipments',
    component: ShipmentListScreen,
    icon: 'truck',
    label: 'Shipments',
    roles: ['SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OPS'],
  },
  {
    name: 'Map',
    component: MapScreen,
    icon: 'map',
    label: 'Map',
    roles: ['SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OPS', 'TECHNICIAN'],
  },
  {
    name: 'Training',
    component: TrainingLibraryScreen,
    icon: 'school',
    label: 'Training',
    roles: ['SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OPS', 'TECHNICIAN'],
  },
  {
    name: 'Warehouses',
    component: WarehouseManagementScreen,
    icon: 'warehouse',
    label: 'Warehouses',
    roles: ['SUPER_ADMIN', 'WAREHOUSE_MANAGER'],
  },
];

const getVisibleTabs = (role: BackendAuthRole | undefined): TabDef[] => {
  if (!role) return [];
  return ALL_TABS.filter((tab) => tab.roles.includes(role));
};

// Custom Tab Bar Component
interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  tabs: TabDef[];
}

const CustomTabBar: React.FC<TabBarProps> = ({ state, descriptors, navigation, tabs }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tab = tabs.find((t) => t.name === route.name);
        if (!tab) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[styles.tabItem, isFocused && styles.tabItemActive]}
          >
            <View
              style={[
                styles.tabIconContainer,
                isFocused && styles.tabIconContainerActive,
              ]}
            >
              <Icon
                name={tab.icon}
                size={22}
                color={isFocused ? Colors.primary : Colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                isFocused && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// Main Tab Navigator
const MainTabNavigator = () => {
  const { user } = useAuth();
  const visibleTabs = React.useMemo(() => getVisibleTabs(user?.role), [user?.role]);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} tabs={visibleTabs} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {visibleTabs.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
};

// Root Stack Navigator
export const AppNavigator = () => {
  const { isAuthenticated, login, signup } = useAuth();
  const navigationRef = useNavigationContainerRef();

  return (
    <NavigationContainer theme={DarkTheme} ref={navigationRef}>
      <Stack.Navigator
        key={isAuthenticated ? 'app-stack' : 'auth-stack'}
        initialRouteName={isAuthenticated ? 'Main' : 'Login'}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login">
              {({ navigation }) => (
                <LoginScreen
                  onLogin={login}
                  onNavigateToSignup={() => navigation.navigate('Signup')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Signup">
              {({ navigation }) => (
                <SignupScreen
                  onSignup={signup}
                  onNavigateToLogin={() => navigation.navigate('Login')}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="MachineDetail" component={MachineDetailScreen} />
            <Stack.Screen name="TrainingDetail" component={TrainingDetailScreen} />
            <Stack.Screen name="AddMachine" component={AddMachineScreen} />
            <Stack.Screen name="UserManagement" component={UserManagementScreen} />
          </>
        )}
      </Stack.Navigator>
      {isAuthenticated && <AppDrawer navigate={(route) => navigationRef.navigate(route as never)} />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  tabItemActive: {},
  tabIconContainer: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    marginBottom: 2,
  },
  tabIconContainerActive: {
    backgroundColor: `${Colors.primary}20`,
  },
  tabLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default AppNavigator;
