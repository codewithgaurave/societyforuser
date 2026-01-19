// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

// 🎨 Premium Color Palettes
const colorPalettes = {
  corporate: {
    primary: "#1a365d",
    secondary: "#2d3748",
    accent: "#d69e2e",
    success: "#38a169",
    warning: "#dd6b20",
    danger: "#e53e3e",
    info: "#3182ce",
    backgroundLight: "#f7fafc",
    backgroundDark: "#1a202c",
    surfaceLight: "#ffffff",
    surfaceDark: "#2d3748",
    textLight: "#2d3748",
    textDark: "#f7fafc",
    borderLight: "#e2e8f0",
    borderDark: "#4a5568",
    hoverLight: "#edf2f7",
    hoverDark: "#4a5568",
    activeLight: "#e2e8f0",
    activeDark: "#4a5568",
  },
  luxury: {
    primary: "#1e3a8a",
    secondary: "#374151",
    accent: "#b45309",
    success: "#047857",
    warning: "#b45309",
    danger: "#dc2626",
    info: "#0369a1",
    backgroundLight: "#fefefe",
    backgroundDark: "#111827",
    surfaceLight: "#ffffff",
    surfaceDark: "#1f2937",
    textLight: "#111827",
    textDark: "#f9fafb",
    borderLight: "#e5e7eb",
    borderDark: "#374151",
    hoverLight: "#f3f4f6",
    hoverDark: "#374151",
    activeLight: "#e5e7eb",
    activeDark: "#374151",
  },
  modern: {
    primary: "#2563eb",
    secondary: "#475569",
    accent: "#f59e0b",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
    backgroundLight: "#f8fafc",
    backgroundDark: "#0f172a",
    surfaceLight: "#ffffff",
    surfaceDark: "#1e293b",
    textLight: "#1e293b",
    textDark: "#f1f5f9",
    borderLight: "#e2e8f0",
    borderDark: "#334155",
    hoverLight: "#f1f5f9",
    hoverDark: "#334155",
    activeLight: "#e2e8f0",
    activeDark: "#334155",
  },
  minimal: {
    primary: "#000000",
    secondary: "#4b5563",
    accent: "#6b7280",
    success: "#059669",
    warning: "#d97706",
    danger: "#dc2626",
    info: "#2563eb",
    backgroundLight: "#ffffff",
    backgroundDark: "#000000",
    surfaceLight: "#f9fafb",
    surfaceDark: "#111827",
    textLight: "#111827",
    textDark: "#f9fafb",
    borderLight: "#d1d5db",
    borderDark: "#374151",
    hoverLight: "#f3f4f6",
    hoverDark: "#374151",
    activeLight: "#e5e7eb",
    activeDark: "#374151",
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    return localStorage.getItem("theme") || "light";
  };

  const getInitialPalette = () => {
    return localStorage.getItem("palette") || "corporate";
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [palette, setPalette] = useState(getInitialPalette);

  useEffect(() => {
    const html = document.documentElement;

    if (theme === "dark") {
      html.classList.add("dark");
      html.setAttribute("data-theme", "dark");
    } else {
      html.classList.remove("dark");
      html.setAttribute("data-theme", "light");
    }

    localStorage.setItem("theme", theme);
    localStorage.setItem("palette", palette);
  }, [theme, palette]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const changePalette = (newPalette) => {
    if (colorPalettes[newPalette]) {
      setPalette(newPalette);
    }
  };

  // Get current palette with fallback
  const currentPalette = colorPalettes[palette] || colorPalettes.corporate;

  // Theme colors configuration
  const themeColors = {
    light: {
      mode: 'light',
      primary: currentPalette.primary,
      secondary: currentPalette.secondary,
      accent: currentPalette.accent,
      success: currentPalette.success,
      warning: currentPalette.warning,
      danger: currentPalette.danger,
      info: currentPalette.info,
      background: currentPalette.backgroundLight,
      surface: currentPalette.surfaceLight,
      text: currentPalette.textLight,
      textSecondary: currentPalette.secondary,
      border: currentPalette.borderLight,
      hover: {
        background: currentPalette.hoverLight,
        text: currentPalette.textLight,
      },
      active: {
        background: currentPalette.activeLight,
        text: currentPalette.primary,
      },
      onPrimary: '#ffffff',
    },
    dark: {
      mode: 'dark',
      primary: currentPalette.primary,
      secondary: currentPalette.secondary,
      accent: currentPalette.accent,
      success: currentPalette.success,
      warning: currentPalette.warning,
      danger: currentPalette.danger,
      info: currentPalette.info,
      background: currentPalette.backgroundDark,
      surface: currentPalette.surfaceDark,
      text: currentPalette.textDark,
      textSecondary: currentPalette.secondary,
      border: currentPalette.borderDark,
      hover: {
        background: currentPalette.hoverDark,
        text: currentPalette.textDark,
      },
      active: {
        background: currentPalette.activeDark,
        text: currentPalette.surfaceDark,
      },
      onPrimary: '#ffffff',
    },
  };

  // Get current theme colors with fallback
  const currentThemeColors = themeColors[theme] || themeColors.light;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        palette,
        changePalette,
        themeColors: currentThemeColors,
        availablePalettes: Object.keys(colorPalettes)
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};