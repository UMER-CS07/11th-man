// File: src/components/SwipeableRow.tsx
// Requirement 08: Gesture-driven interaction using react-native-reanimated + react-native-gesture-handler
import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '@/src/context/ThemeContext';

const SWIPE_THRESHOLD = -80; // how far to swipe before snap
const DELETE_THRESHOLD = -120; // snap fully open to reveal delete zone

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  deleteLabel?: string;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  deleteLabel = 'Delete',
}) => {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);
  const rowHeight = useSharedValue<number | undefined>(undefined);

  const confirmDelete = () => {
    if (!onDelete) return;
    Alert.alert('Delete Conversation', 'Are you sure you want to remove this conversation?', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          translateX.value = withSpring(0);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          // Animate height collapse then delete
          rowHeight.value = withTiming(0, { duration: 250 }, (finished) => {
            if (finished) runOnJS(onDelete)();
          });
        },
      },
    ]);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])  // only activate if clearly horizontal
    .onUpdate((e) => {
      // Only allow leftward swipes
      translateX.value = Math.min(0, Math.max(e.translationX, -160));
    })
    .onEnd(() => {
      if (translateX.value < DELETE_THRESHOLD) {
        // Snap open fully
        translateX.value = withSpring(-120);
      } else if (translateX.value < SWIPE_THRESHOLD) {
        // Snap to peek
        translateX.value = withSpring(-80);
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    height: rowHeight.value,
    overflow: 'hidden',
  }));

  // Red delete button fades in as user swipes
  const deleteStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, -80], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  return (
    <View style={styles.container}>
      {/* Delete action behind the row */}
      <Animated.View style={[styles.deleteAction, deleteStyle, { backgroundColor: colors.error }]}>
        <Text style={[styles.deleteText, { color: '#ffffff' }]} onPress={() => runOnJS(confirmDelete)()}>
          🗑 {deleteLabel}
        </Text>
      </Animated.View>

      {/* The actual row content — slides left */}
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
