import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_THEME } from '../../../constants/theme';
import { IconButton, ToggleSwitch } from '../../common';

const C = APP_THEME;
const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

export default function AdvancedSettingsScreen({
    accent,
    autoPlayNext,
    onToggleAutoPlayNext,
    pitchCorrection,
    onTogglePitchCorrection,
    hapticsEnabled,
    onToggleHaptics,
    playbackRate,
    onSetPlaybackRate,
    volumeLimit,
    onSetVolumeLimit,
    onReset,
    onBack,
}) {
    const [sliderWidth, setSliderWidth] = useState(1);
    const volumePercent = Math.round(volumeLimit * 100);

    function setVolumeFromEvent(event) {
        const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / sliderWidth));
        onSetVolumeLimit(0.3 + ratio * 0.7);
    }

    return (
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <IconButton name="arrow-back" color={C.text} onPress={onBack} accessibilityLabel="Back to settings" />
                <Text style={styles.title}>Advanced settings</Text>
                <View style={styles.headerSpacer} />
            </View>

            <Text style={styles.intro}>Fine-tune how Wave handles playback and output.</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Playback behavior</Text>
                <View style={styles.row}>
                    <View style={styles.rowIcon}><Ionicons name="play-skip-forward-outline" size={19} color={accent} /></View>
                    <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>Play next automatically</Text>
                        <Text style={styles.rowDetail}>Continue with the next queued track</Text>
                    </View>
                    <ToggleSwitch enabled={autoPlayNext} onToggle={onToggleAutoPlayNext} activeColor={accent} />
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                    <View style={styles.rowIcon}><Ionicons name="musical-note-outline" size={19} color={accent} /></View>
                    <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>Preserve pitch</Text>
                        <Text style={styles.rowDetail}>Keep voices natural at different speeds</Text>
                    </View>
                    <ToggleSwitch enabled={pitchCorrection} onToggle={onTogglePitchCorrection} activeColor={accent} />
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                    <View style={styles.rowIcon}><Ionicons name="pulse-outline" size={19} color={accent} /></View>
                    <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>Haptic feedback</Text>
                        <Text style={styles.rowDetail}>Light tap when playback starts or pauses</Text>
                    </View>
                    <ToggleSwitch enabled={hapticsEnabled} onToggle={onToggleHaptics} activeColor={accent} />
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.valueHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>Playback speed</Text>
                        <Text style={styles.sectionDetail}>Applies to the current and next track</Text>
                    </View>
                    <Text style={[styles.currentValue, { color: accent }]}>{playbackRate}x</Text>
                </View>
                <View style={styles.rateRow}>
                    {PLAYBACK_RATES.map((rate) => {
                        const selected = playbackRate === rate;
                        return (
                            <Pressable
                                key={rate}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                onPress={() => onSetPlaybackRate(rate)}
                                style={[styles.rateButton, selected && { backgroundColor: accent }]}
                            >
                                <Text style={[styles.rateText, selected && styles.rateTextActive]}>{rate}x</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.valueHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>Maximum volume</Text>
                        <Text style={styles.sectionDetail}>Limit the player output level</Text>
                    </View>
                    <Text style={[styles.currentValue, { color: accent }]}>{volumePercent}%</Text>
                </View>
                <Pressable
                    accessibilityRole="adjustable"
                    accessibilityLabel="Maximum playback volume"
                    accessibilityValue={{ min: 30, max: 100, now: volumePercent }}
                    accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                    onAccessibilityAction={(event) => onSetVolumeLimit(volumeLimit + (event.nativeEvent.actionName === 'increment' ? 0.05 : -0.05))}
                    onLayout={(event) => setSliderWidth(Math.max(1, event.nativeEvent.layout.width))}
                    onPress={setVolumeFromEvent}
                    style={styles.sliderTrack}
                >
                    <View style={[styles.sliderFill, { width: `${((volumeLimit - 0.3) / 0.7) * 100}%`, backgroundColor: accent }]} />
                    <View style={[styles.sliderThumb, { left: `${((volumeLimit - 0.3) / 0.7) * 100}%`, borderColor: accent }]} />
                </Pressable>
                <View style={styles.sliderLabels}><Text style={styles.sectionDetail}>30%</Text><Text style={styles.sectionDetail}>100%</Text></View>
            </View>

            <Pressable onPress={onReset} style={styles.resetButton} accessibilityRole="button">
                <Ionicons name="refresh-outline" size={17} color={C.secondary} />
                <Text style={styles.resetText}>Restore defaults</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    page: { paddingHorizontal: 18, paddingBottom: 30 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
    title: { flex: 1, color: C.text, fontSize: 22, fontWeight: '700' },
    headerSpacer: { width: 42 },
    intro: { color: C.secondary, fontSize: 13, lineHeight: 19, marginHorizontal: 4, marginBottom: 19 },
    section: { padding: 15, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, marginBottom: 13 },
    sectionTitle: { color: C.text, fontSize: 14, fontWeight: '700' },
    sectionDetail: { color: C.secondary, fontSize: 11, lineHeight: 16, marginTop: 4 },
    row: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 11 },
    rowIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: { color: C.text, fontSize: 13, fontWeight: '600' },
    rowDetail: { color: C.secondary, fontSize: 10, marginTop: 4 },
    divider: { height: 1, backgroundColor: C.border, marginLeft: 47 },
    valueHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    currentValue: { fontSize: 15, fontWeight: '700' },
    rateRow: { flexDirection: 'row', gap: 7, marginTop: 16 },
    rateButton: { flex: 1, minHeight: 38, borderRadius: 11, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
    rateText: { color: C.secondary, fontSize: 11, fontWeight: '700' },
    rateTextActive: { color: C.background },
    sliderTrack: { height: 28, justifyContent: 'center', marginTop: 14 },
    sliderFill: { height: 5, borderRadius: 3 },
    sliderThumb: { position: 'absolute', width: 17, height: 17, borderRadius: 9, backgroundColor: C.text, borderWidth: 2, marginLeft: -8 },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    resetButton: { minHeight: 44, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    resetText: { color: C.secondary, fontSize: 12, fontWeight: '600' },
});