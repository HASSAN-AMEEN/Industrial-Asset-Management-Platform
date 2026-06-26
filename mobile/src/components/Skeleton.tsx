import React from 'react';
import { Animated, DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { BorderRadius, Colors } from '../utils/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A lightweight loading placeholder that gently pulses its opacity.
 * Used instead of spinners so loading states feel like the content
 * is materialising rather than blocking.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  radius = BorderRadius.sm,
  style,
}) => {
  const opacity = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: Colors.backgroundHover,
          opacity,
        },
        style,
      ]}
    />
  );
};

export default Skeleton;
