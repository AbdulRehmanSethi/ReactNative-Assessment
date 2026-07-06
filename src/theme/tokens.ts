export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export interface ColorTokens {
  primary: string;
  primaryText: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  gradientStart: string;
  gradientEnd: string;
}

export const lightColors: ColorTokens = {
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F3F4F6',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#D1D5DB',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  gradientStart: '#2563EB',
  gradientEnd: '#7C3AED',
};

export const darkColors: ColorTokens = {
  primary: '#3B82F6',
  primaryText: '#FFFFFF',
  background: '#0B0F19',
  surface: '#1A1F2B',
  text: '#F3F4F6',
  textMuted: '#9CA3AF',
  border: '#2D3341',
  error: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
  gradientStart: '#1D4ED8',
  gradientEnd: '#6D28D9',
};
