import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../utils/theme';
import { RootStackParamList, MainTabParamList } from '../types';
import { useAuth } from '../store/AuthContext';

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

// Custom Tab Bar Component
interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<TabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'Dashboard', icon: 'view-dashboard', label: 'Home' },
    { name: 'Machines', icon: 'cog', label: 'Machines' },
    { name: 'Shipments', icon: 'truck', label: 'Shipments' },
    { name: 'Map', icon: 'map', label: 'Map' },
    { name: 'Settings', icon: 'account-cog', label: 'Settings' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tab = tabs[index];

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

// Settings Screen Placeholder
const SettingsScreen = () => (
  <UserManagementScreen />
);

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Machines" component={MachineListScreen} />
      <Tab.Screen name="Shipments" component={ShipmentListScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Root Stack Navigator
export const AppNavigator = () => {
  const { isAuthenticated, login, signup } = useAuth();

  return (
    <NavigationContainer theme={DarkTheme}>
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
            <Stack.Screen name="AddMachine" component={AddMachineScreen} />
          </>
        )}
      </Stack.Navigator>
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
