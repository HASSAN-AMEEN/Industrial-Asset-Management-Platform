import { useWindowDimensions, PixelRatio, Platform } from 'react-native';
import { useMemo } from 'react';

/**
 * Hook for responsive sizing and layout calculations
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  
  // Base dimensions (iPhone 14 Pro as reference)
  const baseWidth = 393;
  const baseHeight = 852;
  
  const scale = useMemo(() => width / baseWidth, [width]);
  const verticalScale = useMemo(() => height / baseHeight, [height]);
  const moderateScale = useMemo(() => (factor = 0.5) => width / baseWidth + (scale - 1) * factor, [width, scale]);
  
  // Responsive width percentage
  const wp = (percentage: number) => (width * percentage) / 100;
  
  // Responsive height percentage
  const hp = (percentage: number) => (height * percentage) / 100;
  
  // Responsive font size
  const fontSize = (size: number) => {
    const newSize = size * scale;
    if (Platform.OS === 'ios') {
      return Math.round(PixelRatio.roundToNearestPixel(newSize));
    }
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  };
  
  // Responsive spacing
  const spacing = (size: number) => Math.round(size * scale);
  
  // Device type detection
  const isSmallDevice = width < 375;
  const isMediumDevice = width >= 375 && width < 414;
  const isLargeDevice = width >= 414;
  const isTablet = width >= 768;
  
  return {
    width,
    height,
    scale,
    verticalScale,
    moderateScale,
    wp,
    hp,
    fontSize,
    spacing,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isTablet,
  };
};

export default useResponsive;
