import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYBACK_SETTINGS_KEY = '@wave-music/playback-settings-v1';

export const DEFAULT_PLAYBACK_SETTINGS = {
    autoPlayNext: true,
    pitchCorrection: true,
    hapticsEnabled: true,
    playbackRate: 1,
    volumeLimit: 1,
};

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

function normalizeSettings(value) {
    return {
        autoPlayNext: typeof value.autoPlayNext === 'boolean' ? value.autoPlayNext : DEFAULT_PLAYBACK_SETTINGS.autoPlayNext,
        pitchCorrection: typeof value.pitchCorrection === 'boolean' ? value.pitchCorrection : DEFAULT_PLAYBACK_SETTINGS.pitchCorrection,
        hapticsEnabled: typeof value.hapticsEnabled === 'boolean' ? value.hapticsEnabled : DEFAULT_PLAYBACK_SETTINGS.hapticsEnabled,
        playbackRate: PLAYBACK_RATES.includes(value.playbackRate) ? value.playbackRate : DEFAULT_PLAYBACK_SETTINGS.playbackRate,
        volumeLimit: Number.isFinite(value.volumeLimit)
            ? Math.max(0.3, Math.min(1, value.volumeLimit))
            : DEFAULT_PLAYBACK_SETTINGS.volumeLimit,
    };
}

export async function loadPlaybackSettings() {
    try {
        const storedSettings = await AsyncStorage.getItem(PLAYBACK_SETTINGS_KEY);
        return storedSettings ? normalizeSettings(JSON.parse(storedSettings)) : DEFAULT_PLAYBACK_SETTINGS;
    } catch {
        return DEFAULT_PLAYBACK_SETTINGS;
    }
}

export async function savePlaybackSettings(settings) {
    try {
        await AsyncStorage.setItem(PLAYBACK_SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
    } catch {
        // Keep playback usable when local preference storage is unavailable.
    }
}
