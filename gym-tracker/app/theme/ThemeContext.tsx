import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark" | "system";

type ThemeColors = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryLight: string;
  border: string;
  borderLight: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  tabBar: string;
  tabBarBorder: string;
  inputBackground: string;
  cardBackground: string;
  headerBackground: string;
};

const lightColors: ThemeColors = {
  background: "#f3f4f6",
  surface: "#ffffff",
  surfaceSecondary: "#f9fafb",
  text: "#1f2937",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",
  primary: "#3b82f6",
  primaryLight: "#dbeafe",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
  danger: "#dc2626",
  dangerLight: "#fef2f2",
  success: "#22c55e",
  successLight: "#f0fdf4",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  tabBar: "#ffffff",
  tabBarBorder: "#e5e7eb",
  inputBackground: "#ffffff",
  cardBackground: "#ffffff",
  headerBackground: "#ffffff",
};

const darkColors: ThemeColors = {
  background: "#111111",
  surface: "#1c1c1e",
  surfaceSecondary: "#2c2c2e",
  text: "#f5f5f5",
  textSecondary: "#a1a1aa",
  textTertiary: "#71717a",
  primary: "#3b82f6",
  primaryLight: "#1e3a5f",
  border: "#2c2c2e",
  borderLight: "#3a3a3c",
  danger: "#ef4444",
  dangerLight: "#3b1113",
  success: "#22c55e",
  successLight: "#14532d",
  warning: "#f59e0b",
  warningLight: "#422006",
  tabBar: "#1c1c1e",
  tabBarBorder: "#2c2c2e",
  inputBackground: "#2c2c2e",
  cardBackground: "#1c1c1e",
  headerBackground: "#1c1c1e",
};

type ThemeContextType = {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  mode: "system",
  isDark: false,
  setMode: () => {},
});

const THEME_STORAGE_KEY = "@gym_tracker_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
  };

  const isDark =
    mode === "dark" || (mode === "system" && systemScheme === "dark");

  const colors = isDark ? darkColors : lightColors;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ colors, mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}