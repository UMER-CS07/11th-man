// File: src/components/SafeAreaWrapper.tsx
import React from 'react';
import { View, ViewProps, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/context/ThemeContext';

export const SafeAreaWrapper: React.FC<ViewProps> = ({ children, style, ...rest }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}
      {...rest}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={true}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
