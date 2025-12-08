import { StyleSheet } from 'react-native';
import { Theme } from './Colors';

export const CommonStyles = StyleSheet.create({
    shadowSmall: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    shadowMedium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    shadowLarge: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    container: {
        flex: 1,
        backgroundColor: Theme.background,
    },
    header: {
        fontSize: 34,
        fontWeight: '700',
        color: Theme.text,
        letterSpacing: 0.37,
        marginBottom: 16,
    },
    subHeader: {
        fontSize: 20,
        fontWeight: '600',
        color: Theme.text,
        letterSpacing: 0.38,
        marginBottom: 12,
    },
    text: {
        fontSize: 17,
        color: Theme.text,
        lineHeight: 22,
    },
    textSecondary: {
        fontSize: 15,
        color: Theme.textSecondary,
        lineHeight: 20,
    },
});
