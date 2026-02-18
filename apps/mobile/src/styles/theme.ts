/**
 * Design Tokens Mobile - Projetoapp
 * Consistente com Web (Teal + Amber)
 */

const baseSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const baseBorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const lightTheme = {
  dark: false,
  colors: {
    primary: '#14b8a6',
    primaryLight: '#ccfbf1',
    primaryDark: '#0f766e',
    accent: '#f59e0b',
    accentLight: '#fef3c7',
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
    text: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  }
};

export const darkTheme = {
  dark: true,
  colors: {
    primary: '#2dd4bf', // Teal 400 para melhor contraste em dark
    primaryLight: '#042f2e',
    primaryDark: '#5eead4',
    accent: '#fbbf24',
    accentLight: '#451a03',
    background: '#020617', // Slate 950
    surface: '#0f172a', // Slate 900
    border: '#1e293b', // Slate 800
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  }
};

// Mantendo export default para compatibilidade legada se necessário
export const theme = lightTheme;
