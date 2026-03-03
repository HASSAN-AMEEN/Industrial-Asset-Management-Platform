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
  email: string;
  role: string;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role?: string;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  // Add more screens here as needed
};

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
