import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';

export function useColorScheme() {
    const { themeMode } = useThemeStore();
    const systemColorScheme = useNativeColorScheme();

    if (themeMode === 'system') {
        return systemColorScheme;
    }
    return themeMode;
}

