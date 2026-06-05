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
    primary: '#D4AF37', // Gold
    primaryLight: '#F5ECBF',
    primaryDark: '#7F6921',
    accent: '#2C2825', // Coffee
    accentLight: '#5C5855',
    background: '#FDFBF7', // Ivory
    surface: '#ffffff',
    border: '#e5e7eb',
    text: '#2C2825', // Coffee
    textSecondary: '#5C5855',
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
    primary: '#D4AF37',
    primaryLight: '#554616',
    primaryDark: '#E6D166',
    accent: '#FAF6E9',
    accentLight: '#FDFBF7',
    background: '#151205',
    surface: '#2A230B',
    border: '#554616',
    text: '#FDFBF7',
    textSecondary: '#E6E6E6',
    textMuted: '#a1a1aa',
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
