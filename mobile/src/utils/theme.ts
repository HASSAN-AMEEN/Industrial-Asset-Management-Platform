/**
 * IronTrack Theme Configuration
 * All colors and styling constants are centralized here for easy customization
 */

export const Colors = {
  // Primary Colors
  primary: '#8A9A5B',        // Sage green - main brand color
  primaryLight: '#A8B87A',   // Lighter sage for hover states
  primaryDark: '#6B7A45',    // Darker sage for pressed states
  
  // Secondary Colors
  secondary: '#3D9DAE',      // Teal - secondary actions
  secondaryLight: '#5BB5C5',
  secondaryDark: '#2D7D8E',
  
  // Accent Colors
  accent: '#D4AF72',         // Champagne gold - highlights
  accentLight: '#E5C99A',
  accentDark: '#B8955A',
  
  // Background Colors
  background: '#1C1E1F',     // Main dark background
  backgroundElevated: '#242728', // Cards and elevated surfaces
  backgroundInput: '#2A2D2E',    // Input fields
  backgroundHover: '#303334',    // Hover states
  
  // Surface Colors
  surface: '#242728',
  surfaceVariant: '#2A2D2E',
  
  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textDisabled: '#4B5563',
  
  // Status Colors
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  
  error: '#EF4444',
  errorLight: '#F87171',
  errorDark: '#DC2626',
  
  info: '#3B82F6',
  infoLight: '#60A5FA',
  infoDark: '#2563EB',
  
  // Border Colors
  border: '#374151',
  borderLight: '#4B5563',
  borderFocus: '#8A9A5B',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Transparent
  transparent: 'transparent',
  
  // White/Black
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
  header: 32,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadows = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

// React Native Paper Theme Configuration
export const PaperTheme = {
  dark: true,
  colors: {
    primary: Colors.primary,
    primaryContainer: Colors.primaryDark,
    secondary: Colors.secondary,
    secondaryContainer: Colors.secondaryDark,
    tertiary: Colors.accent,
    tertiaryContainer: Colors.accentDark,
    surface: Colors.surface,
    surfaceVariant: Colors.surfaceVariant,
    surfaceDisabled: Colors.backgroundInput,
    background: Colors.background,
    error: Colors.error,
    errorContainer: Colors.errorDark,
    onPrimary: Colors.white,
    onPrimaryContainer: Colors.white,
    onSecondary: Colors.white,
    onSecondaryContainer: Colors.white,
    onTertiary: Colors.black,
    onTertiaryContainer: Colors.white,
    onSurface: Colors.textPrimary,
    onSurfaceVariant: Colors.textSecondary,
    onSurfaceDisabled: Colors.textDisabled,
    onError: Colors.white,
    onErrorContainer: Colors.white,
    onBackground: Colors.textPrimary,
    outline: Colors.border,
    outlineVariant: Colors.borderLight,
    inverseSurface: Colors.white,
    inverseOnSurface: Colors.background,
    inversePrimary: Colors.primaryDark,
    shadow: Colors.black,
    scrim: Colors.overlay,
    backdrop: Colors.overlay,
    elevation: {
      level0: 'transparent',
      level1: Colors.backgroundElevated,
      level2: Colors.surfaceVariant,
      level3: Colors.backgroundHover,
      level4: Colors.backgroundHover,
      level5: Colors.backgroundHover,
    },
  },
  roundness: BorderRadius.md,
};

export default {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
  Shadows,
  PaperTheme,
};
