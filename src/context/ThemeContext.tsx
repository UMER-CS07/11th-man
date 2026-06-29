// File: src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, ThemeMode } from '@/src/constants/theme';

interface ThemeProps {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof COLORS.light;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeProps | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem('@theme_mode');
      if (storedTheme) setMode(storedTheme as ThemeMode);
    };
    loadTheme();
  }, []);

  const setThemeMode = async (newMode: ThemeMode) => {
    setMode(newMode);
    await AsyncStorage.setItem('@theme_mode', newMode);
  };

  const isDark = mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const toggleTheme = async () => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
    await AsyncStorage.setItem('@theme_mode', newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
