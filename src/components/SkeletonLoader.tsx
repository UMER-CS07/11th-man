// File: src/components/SkeletonLoader.tsx
// Req #08: Skeleton shimmer using react-native-reanimated withRepeat + withSequence
import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  style,
  borderRadius = 8,
}) => {
  const { colors } = useTheme();

  // Run shimmer animation on the UI thread via Reanimated
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(0.3, { duration: 700, easing: Easing.in(Easing.ease) })
      ),
      -1, // repeat infinitely
      false // do not reverse (sequence handles direction)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: colors.surfaceRaised,
          borderRadius,
        },
        style,
        animatedStyle,
      ]}
    />
  );
};
