export const Colors = {
  dark: {
    background: '#000000',
    surface: '#1C1C1E', // iOS System Gray 6 Dark
    surfaceHighlight: '#2C2C2E', // iOS System Gray 5 Dark
    surfaceSubtle: '#3A3A3C',
    primary: '#FFD43B', // Apple Notes Yellow
    primaryGradient: ['#FFD43B', '#FFC000'], // Yellow Gradient
    accent: '#FFD43B',
    accentLight: 'rgba(255, 212, 59, 0.12)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.60)',
    textTertiary: 'rgba(255, 255, 255, 0.35)',
    border: '#38383A',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FFD60A',
    shadows: {
      small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
      },
      large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
      },
    },
  },
  light: {
    background: '#FFFFFF', // Pure white
    surface: '#FFFFFF',
    surfaceSecondary: '#F9F9F9', // Warmer gray
    surfaceHighlight: '#F2F2F7',
    surfaceSubtle: '#E5E5EA',
    primary: '#FFD43B', // Apple Notes Yellow
    primaryGradient: ['#FFD43B', '#FFC000'],
    accent: '#FFD43B',
    accentLight: 'rgba(255, 212, 59, 0.12)',
    text: '#000000',
    textSecondary: '#8E8E93',
    textTertiary: '#C7C7CC',
    border: '#E5E5EA',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FFCC00',
    shadows: {
      small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      },
      large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
    },
  },
  typography: {
    largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: 0.37 },
    title1: { fontSize: 28, fontWeight: '700', letterSpacing: 0.36 },
    title2: { fontSize: 22, fontWeight: '700', letterSpacing: 0.35 },
    title3: { fontSize: 20, fontWeight: '600', letterSpacing: 0.38 },
    headline: { fontSize: 17, fontWeight: '600', letterSpacing: -0.41 },
    body: { fontSize: 17, fontWeight: '400', letterSpacing: -0.41 },
    callout: { fontSize: 16, fontWeight: '400', letterSpacing: -0.32 },
    subhead: { fontSize: 15, fontWeight: '400', letterSpacing: -0.24 },
    footnote: { fontSize: 13, fontWeight: '400', letterSpacing: -0.08 },
    caption1: { fontSize: 12, fontWeight: '400', letterSpacing: 0 },
    caption2: { fontSize: 11, fontWeight: '400', letterSpacing: 0.07 },
  } as const
};

export const Theme = {
  ...Colors.light,
  typography: Colors.typography,
};
