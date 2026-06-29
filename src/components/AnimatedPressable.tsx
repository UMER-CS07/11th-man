// File: src/components/AnimatedPressable.tsx
import React, { useRef } from 'react';
import { TouchableOpacity, Animated, ViewStyle, StyleSheet } from 'react-native';

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  activeOpacity?: number;
}

// Layout props that must live on the outer TouchableOpacity
// so that flex:1, width, etc. are respected in row/column containers.
const LAYOUT_KEYS: (keyof ViewStyle)[] = [
  'flex', 'flexGrow', 'flexShrink', 'flexBasis',
  'width', 'minWidth', 'maxWidth',
  'height', 'minHeight', 'maxHeight',
  'alignSelf', 'aspectRatio',
];

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPress,
  style,
  activeOpacity = 0.9,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  // Flatten array of styles into a single object
  const flatStyle: ViewStyle = StyleSheet.flatten(style ?? {}) as ViewStyle;

  // Split into layout (for wrapper) and visual (for animated view)
  const wrapperStyle: ViewStyle = {};
  const innerStyle: ViewStyle = { ...flatStyle };
  LAYOUT_KEYS.forEach((key) => {
    if (flatStyle[key] !== undefined) {
      (wrapperStyle as any)[key] = flatStyle[key];
    }
  });

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={wrapperStyle}
    >
      <Animated.View style={[innerStyle, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};
