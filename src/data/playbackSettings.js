import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRESET_MAP } from '../constants/theme';

const PLAYBACK_SETTINGS_KEY = '@wave-music/playback-settings-v1';
const REVERB_OPTIONS = ['Off', 'Room', 'Cathedral', 'Chamber'];
export const DEFAULT_EQ_LEVELS = [0.66, 0.76, 0.82, 0.58, 0.72, 0.64, 0.75, 0.6, 0.86, 0.7];

export const DEFAULT_PLAYBACK_SETTINGS = {
    autoPlayNext: true,
    pitchCorrection: true,
    hapticsEnabled: true,
    playbackRate: 1,
    volumeLimit: 1,
    volume: 1,
    equalizerEnabled: true,
    audioFocusEnabled: true,
    libraryAutoScan: true,
    smartImportEnabled: false,
    eqLevels: DEFAULT_EQ_LEVELS,
    selectedPreset: 'Custom',
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
        ? value.eqLevels.map((level, index) => Number.isFinite(level) ? clamp(level, 0, 1) : DEFAULT_EQ_LEVELS[index])
        : DEFAULT_EQ_LEVELS;

    return {
        autoPlayNext: typeof value.autoPlayNext === 'boolean' ? value.autoPlayNext : DEFAULT_PLAYBACK_SETTINGS.autoPlayNext,
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
        preamp: Number.isFinite(value.preamp) ? clamp(value.preamp, -1, 1) : DEFAULT_PLAYBACK_SETTINGS.preamp,
        bassBoost: Number.isFinite(value.bassBoost) ? clamp(value.bassBoost, -1, 1) : DEFAULT_PLAYBACK_SETTINGS.bassBoost,
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
