import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCENT_COLORS, APP_THEME } from '../constants/theme';

const APPEARANCE_SETTINGS_KEY = '@wave-music/appearance-settings-v1';

export const DEFAULT_APPEARANCE_SETTINGS = {
    themeMode: 'Dark',
    accent: APP_THEME.green,
};

function normalizeSettings(value) {
    return {
        themeMode: ['Light', 'Dark'].includes(value.themeMode)
            ? value.themeMode
            : DEFAULT_APPEARANCE_SETTINGS.themeMode,
        accent: ACCENT_COLORS.includes(value.accent) ? value.accent : DEFAULT_APPEARANCE_SETTINGS.accent,
    };
}

export async function loadAppearanceSettings() {
    try {
        const storedSettings = await AsyncStorage.getItem(APPEARANCE_SETTINGS_KEY);
        return storedSettings ? normalizeSettings(JSON.parse(storedSettings)) : DEFAULT_APPEARANCE_SETTINGS;
    } catch {
        return DEFAULT_APPEARANCE_SETTINGS;
    }
}

export async function saveAppearanceSettings(settings) {
    try {
        await AsyncStorage.setItem(APPEARANCE_SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
    } catch {
        // Keep appearance controls usable when local preference storage is unavailable.
    }
}
