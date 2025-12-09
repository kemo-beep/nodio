export const Colors = {
  dark: {
    background: '#000000',
    surface: '#1C1C1E', // iOS System Gray 6 Dark
    surfaceHighlight: '#2C2C2E', // iOS System Gray 5 Dark
    surfaceSubtle: '#3A3A3C',
    primary: '#0A84FF', // iOS System Blue Dark
    primaryGradient: ['#0A84FF', '#5E5CE6'], // Blue to Indigo
    accent: '#FFD60A',
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      },
      large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 8,
      },
    },
  },
  light: {
    background: '#F2F2F7', // iOS System Gray 6
    surface: '#FFFFFF',
    surfaceHighlight: '#F9F9F9',
    surfaceSubtle: '#E5E5EA', // iOS System Gray 3
    primary: '#007AFF', // iOS System Blue
    primaryGradient: ['#007AFF', '#5856D6'], // Blue to Indigo
    accent: '#FFCC00',
    text: '#000000',
    textSecondary: '#8E8E93', // iOS System Gray
    textTertiary: '#C7C7CC', // iOS System Gray 2
    border: '#D1D1D6', // iOS System Gray 4
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FFCC00',
    shadows: {
      small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      },
      large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
      },
    },
  },
};

export const Theme = Colors.light; // Default to light as requested
