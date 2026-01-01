// Robust Theme - Sage / Money Green Aesthetic

export const colors = {
  // Primary Sage Palette
  sage: {
    50: '#F2F7F2',
    100: '#E4EDE4',
    200: '#C9DBC9',
    300: '#A7C4A7',
    400: '#86A789',
    500: '#6B8E6B',
    600: '#537553',
    700: '#3D5A3D',
    800: '#2A402A',
    900: '#1A291A',
  },

  // Neutral Palette
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#0D0D0F',
  },

  // Accent Colors
  gold: '#C9A962',
  cream: '#FAF8F0',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
};

export const lightTheme = {
  // Backgrounds
  background: '#FCFCFA',
  backgroundSecondary: '#F5F5F0',
  backgroundTertiary: '#FFFFFF',
  
  // Cards & Surfaces
  card: '#FFFFFF',
  cardBorder: '#E8E8E0',
  cardElevated: '#FFFFFF',
  
  // Text
  text: '#1A1F1A',
  textSecondary: '#4A524A',
  textTertiary: '#7A857A',
  textInverse: '#FFFFFF',
  
  // Primary
  primary: '#6B8E6B',
  primaryLight: '#86A789',
  primaryDark: '#537553',
  
  // Accent
  accent: '#C9A962',
  accentLight: '#DBC48A',
  
  // Status
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#EF4444',
  
  // Borders
  border: '#E8E8E0',
  borderLight: '#F0F0E8',
  
  // Tab Bar
  tabBar: '#FFFFFF',
  tabBarBorder: '#E8E8E0',
  tabActive: '#6B8E6B',
  tabInactive: '#A1A1AA',
  
  // Input
  inputBackground: '#F5F5F0',
  inputBorder: '#E8E8E0',
  inputText: '#1A1F1A',
  inputPlaceholder: '#A1A1AA',
};

export const darkTheme = {
  // Backgrounds
  background: '#0F120F',
  backgroundSecondary: '#161A16',
  backgroundTertiary: '#1C211C',
  
  // Cards & Surfaces
  card: '#1C211C',
  cardBorder: '#2A302A',
  cardElevated: '#232823',
  
  // Text
  text: '#F0F2F0',
  textSecondary: '#B0B8B0',
  textTertiary: '#707870',
  textInverse: '#0F120F',
  
  // Primary
  primary: '#86A789',
  primaryLight: '#A7C4A7',
  primaryDark: '#6B8E6B',
  
  // Accent
  accent: '#C9A962',
  accentLight: '#DBC48A',
  
  // Status
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  
  // Borders
  border: '#2A302A',
  borderLight: '#232823',
  
  // Tab Bar
  tabBar: '#161A16',
  tabBarBorder: '#2A302A',
  tabActive: '#86A789',
  tabInactive: '#707870',
  
  // Input
  inputBackground: '#1C211C',
  inputBorder: '#2A302A',
  inputText: '#F0F2F0',
  inputPlaceholder: '#707870',
};

export type Theme = typeof lightTheme;

// Typography
export const typography = {
  // Font families - using system fonts with elegant fallbacks
  fonts: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font sizes
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

// Border radius
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

