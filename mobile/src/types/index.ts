/**
 * Common types used throughout the mobile application
 */

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User-related types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  lastActive?: string;
  isOnline?: boolean;
  createdAt?: string;
  avatar?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role?: string;
}

export const USER_ROLES = [
  'admin',
  'manager',
  'technician',
  'viewer',
] as const;

export type UserRole = typeof USER_ROLES[number];

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  MachineDetail: { id?: string } | undefined;
  AddMachine: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Machines: undefined;
  Shipments: undefined;
  Map: undefined;
  Settings: undefined;
};

// Domain/UI types (used by screens)
export type ActivityType = 'shipment' | 'maintenance' | 'installation' | 'alert';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
}

export type InstallationType = 'active' | 'maintenance' | 'offline';

export interface Installation {
  id: string;
  name: string;
  type: InstallationType;
  machineCount: number;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  manager: string;
}

export interface Machine {
  id: string;
  serialNumber: string;
  model: string;
  category?: string;
  status: MachineStatus;

  // Extra UI fields used by v0 mock screens
  type: string;
  location: string;
  operator?: string | null;
  installDate?: string | null;
  lastService: string;
  nextService: string;
  healthScore: number;
  efficiency?: number;
}

export interface MachineFormData {
  serialNumber: string;
  model: string;
  type: string;
  status: MachineStatus;
  location: string;
}

export const MACHINE_STATUSES = [
  'IN_WAREHOUSE',
  'RESERVED',
  'UNDER_SHIPMENT',
  'DELIVERED',
  'INSTALLED',
  'UNDER_MAINTENANCE',
  'RETURNED',
  // v0 sample screens use this too
  'ACTIVE',
  'IN_TRANSIT',
  'MAINTENANCE',
  'RENTED',
  // v0 mock screens use lowercase statuses
  'active',
  'transit',
  'maintenance',
  'inactive',
] as const;

export type MachineStatus = typeof MACHINE_STATUSES[number];

export interface Shipment {
  id: string;
  status: ShipmentStatus;

  // Backend-aligned fields (optional in UI mocks)
  fromWarehouseId?: string;
  toWarehouseId?: string | null;
  toClientId?: string | null;
  shipmentDate?: string;

  // Extra UI fields used by v0 mock screens
  trackingNumber: string;
  origin: string;
  destination: string;
  machineIds: string[];
  departureDate?: string;
  estimatedArrival: string;
  actualArrival?: string;
  carrier?: string;
  estimatedDelivery?: string;
  machineName?: string;
}

export const SHIPMENT_STATUSES = [
  'CREATED',
  'DISPATCHED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  // v0 mock screen statuses
  'pending',
  'in_transit',
  'delivered',
  'delayed',
] as const;

export type ShipmentStatus = typeof SHIPMENT_STATUSES[number];

// Component props types
export interface BaseButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  value: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
