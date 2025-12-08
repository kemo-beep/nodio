export const Colors = {
  dark: {
    background: '#0A0A0A',
    surface: '#1C1C1E',
    surfaceHighlight: '#2C2C2E',
    primary: '#007AFF', // System Blue, but can be customized
    primaryGradient: ['#007AFF', '#00C6FF'],
    accent: '#FFD60A',
    text: '#FFFFFF',
    textSecondary: '#EBEBF599', // 60% white
    textTertiary: '#EBEBF54D', // 30% white
    border: '#38383A',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
  },
  light: {
    // Fallback for light mode if needed, though we aim for dark/premium
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceHighlight: '#F2F2F7',
    primary: '#007AFF',
    primaryGradient: ['#007AFF', '#5AC8FA'],
    accent: '#FFCC00',
    text: '#000000',
    textSecondary: '#3C3C4399',
    textTertiary: '#3C3C434D',
    border: '#C6C6C8',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
  },
};

export const Theme = Colors.light; // Default to light as requested
