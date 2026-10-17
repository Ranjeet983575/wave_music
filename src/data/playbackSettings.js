import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRESET_MAP } from '../constants/theme';

const PLAYBACK_SETTINGS_KEY = '@wave-music/playback-settings-v1';
const AUDIO_DEFAULTS_MIGRATION_KEY = '@wave-music/neutral-audio-defaults-v4';
const REVERB_OPTIONS = ['Off', 'Room', 'Cathedral', 'Chamber'];
export const DEFAULT_EQ_LEVELS = Array(10).fill(0.5);

export const DEFAULT_PLAYBACK_SETTINGS = {
    autoPlayNext: true,
    shuffleEnabled: false,
    repeatAllEnabled: false,
    pitchCorrection: true,
    hapticsEnabled: true,
    playbackRate: 1,
    volumeLimit: 1,
    volume: 1,
    equalizerEnabled: false,
    audioFocusEnabled: true,
    libraryAutoScan: true,
    smartImportEnabled: false,
    eqLevels: DEFAULT_EQ_LEVELS,
    selectedPreset: 'Flat',
    selectedReverb: 'Off',
    preamp: 0,
    bassBoost: 0,
};

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizeSettings(input) {
    const value = input && typeof input === 'object' ? input : {};
    const eqLevels = Array.isArray(value.eqLevels) && value.eqLevels.length === DEFAULT_EQ_LEVELS.length
        ? value.eqLevels.map((level, index) => {
            if (!Number.isFinite(level)) return DEFAULT_EQ_LEVELS[index];
            const gainDb = Math.round((clamp(level, 0, 1) - 0.5) * 24);
            return (gainDb + 12) / 24;
        })
        : DEFAULT_EQ_LEVELS;

    return {
        autoPlayNext: typeof value.autoPlayNext === 'boolean' ? value.autoPlayNext : DEFAULT_PLAYBACK_SETTINGS.autoPlayNext,
        shuffleEnabled: typeof value.shuffleEnabled === 'boolean' ? value.shuffleEnabled : DEFAULT_PLAYBACK_SETTINGS.shuffleEnabled,
        repeatAllEnabled: typeof value.repeatAllEnabled === 'boolean' ? value.repeatAllEnabled : DEFAULT_PLAYBACK_SETTINGS.repeatAllEnabled,
        pitchCorrection: typeof value.pitchCorrection === 'boolean' ? value.pitchCorrection : DEFAULT_PLAYBACK_SETTINGS.pitchCorrection,
        hapticsEnabled: typeof value.hapticsEnabled === 'boolean' ? value.hapticsEnabled : DEFAULT_PLAYBACK_SETTINGS.hapticsEnabled,
        playbackRate: PLAYBACK_RATES.includes(value.playbackRate) ? value.playbackRate : DEFAULT_PLAYBACK_SETTINGS.playbackRate,
        volumeLimit: Number.isFinite(value.volumeLimit)
            ? clamp(value.volumeLimit, 0.3, 1)
            : DEFAULT_PLAYBACK_SETTINGS.volumeLimit,
        volume: Number.isFinite(value.volume) ? clamp(value.volume, 0, 1) : DEFAULT_PLAYBACK_SETTINGS.volume,
        equalizerEnabled: typeof value.equalizerEnabled === 'boolean' ? value.equalizerEnabled : DEFAULT_PLAYBACK_SETTINGS.equalizerEnabled,
        audioFocusEnabled: typeof value.audioFocusEnabled === 'boolean' ? value.audioFocusEnabled : DEFAULT_PLAYBACK_SETTINGS.audioFocusEnabled,
        libraryAutoScan: typeof value.libraryAutoScan === 'boolean' ? value.libraryAutoScan : DEFAULT_PLAYBACK_SETTINGS.libraryAutoScan,
        smartImportEnabled: typeof value.smartImportEnabled === 'boolean' ? value.smartImportEnabled : DEFAULT_PLAYBACK_SETTINGS.smartImportEnabled,
        eqLevels,
        selectedPreset: Object.prototype.hasOwnProperty.call(PRESET_MAP, value.selectedPreset)
            ? value.selectedPreset
            : DEFAULT_PLAYBACK_SETTINGS.selectedPreset,
        selectedReverb: REVERB_OPTIONS.includes(value.selectedReverb) ? value.selectedReverb : DEFAULT_PLAYBACK_SETTINGS.selectedReverb,
        preamp: Number.isFinite(value.preamp) ? Math.round(clamp(value.preamp, -1, 1) * 12) / 12 : DEFAULT_PLAYBACK_SETTINGS.preamp,
        bassBoost: Number.isFinite(value.bassBoost) ? Math.round(clamp(value.bassBoost, -1, 1) * 12) / 12 : DEFAULT_PLAYBACK_SETTINGS.bassBoost,
    };
}

export async function loadPlaybackSettings() {
    try {
        const entries = await AsyncStorage.multiGet([PLAYBACK_SETTINGS_KEY, AUDIO_DEFAULTS_MIGRATION_KEY]);
        const storedSettings = entries.find(([key]) => key === PLAYBACK_SETTINGS_KEY)?.[1];
        const audioDefaultsMigration = entries.find(([key]) => key === AUDIO_DEFAULTS_MIGRATION_KEY)?.[1];
        const settings = storedSettings ? normalizeSettings(JSON.parse(storedSettings)) : DEFAULT_PLAYBACK_SETTINGS;

        if (audioDefaultsMigration !== '1') {
            const migratedSettings = {
                ...settings,
                equalizerEnabled: false,
                selectedReverb: 'Off',
            };
            await AsyncStorage.multiSet([
                [PLAYBACK_SETTINGS_KEY, JSON.stringify(migratedSettings)],
                [AUDIO_DEFAULTS_MIGRATION_KEY, '1'],
            ]);
            return migratedSettings;
        }

        return settings;
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
