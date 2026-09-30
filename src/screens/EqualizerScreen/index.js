import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_THEME, EQ_FREQUENCIES } from '../../constants/theme';
import { ToggleSwitch } from '../../components/common';

const C = APP_THEME;

export default function EqualizerScreen({
  eqLevels,
  selectedPreset,
  selectedReverb,
  preamp,
  bassBoost,
  equalizerEnabled,
  setEqualizerEnabled,
  onBack,
  onUpdateEqLevel,
  onApplyPreset,
  onApplyReverb,
  onUpdatePreamp,
  onUpdateBassBoost,
  setPreampWidth,
  setBassBoostWidth,
  preampWidth,
  bassBoostWidth,
}) {
  const frequencies = EQ_FREQUENCIES;

  const updateSliderValue = (setter, width, xPosition) => {
    const safeWidth = Math.max(1, width || 1);
    const ratio = Math.max(0, Math.min(1, xPosition / safeWidth));
    setter((ratio * 2) - 1);
  };

  const getSliderDisplay = (value) => ((value + 1) / 2) * 100;

  return (
    <ScrollView contentContainerStyle={styles.equalizerPage} showsVerticalScrollIndicator={false}>
      <View style={styles.settingsHeader}>
        <Pressable style={styles.headerBackButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.settingsHeaderTitle}>Equalizer</Text>
        <View style={styles.headerActionBadge}>
          <ToggleSwitch enabled={equalizerEnabled} onToggle={() => setEqualizerEnabled((value) => !value)} activeColor={C.green} />
        </View>
      </View>

      <View style={styles.eqVisualWrap}>
        <View style={styles.eqBars}>
          {eqLevels.map((ratio, index) => (
            <Pressable
              key={frequencies[index]}
              style={styles.eqBarColumn}
              onPress={(event) => {
                const targetHeight = 170;
                const offset = Math.max(0, Math.min(targetHeight, event.nativeEvent.locationY));
                const nextRatio = 1 - offset / targetHeight;
                onUpdateEqLevel(index, nextRatio);
              }}
            >
              <Text style={styles.eqValue}>{ratio.toFixed(1)}</Text>
              <View style={[styles.eqBarTrack, { height: 170 }]}>
                <View style={[styles.eqBarFill, { height: `${ratio * 100}%` }]} />
              </View>
              <Text style={styles.eqFreq}>{frequencies[index]}{index >= 5 ? 'K' : ''}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.presetSection}>
        <View style={styles.presetRowHeader}>
          <Text style={styles.presetTitle}>Presets</Text>
          <Pressable style={styles.savePresetButton}>
            <Text style={styles.savePresetText}>Save preset</Text>
          </Pressable>
        </View>
        <View style={styles.presetGrid}>
          {['Custom', 'Flat', 'Acoustic', 'Classical'].map((preset) => (
            <Pressable
              key={preset}
              style={[styles.presetChip, selectedPreset === preset && styles.presetChipActive]}
              onPress={() => onApplyPreset(preset)}
            >
              <Text style={[styles.presetText, selectedPreset === preset && styles.presetTextActive]}>{preset}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.presetSection}>
        <Text style={styles.presetTitle}>Reverb</Text>
        <View style={styles.presetGrid}>
          {['Off', 'Room', 'Cathedral', 'Chamber'].map((preset) => (
            <Pressable
              key={preset}
              style={[styles.presetChip, selectedReverb === preset && styles.presetChipActive]}
              onPress={() => onApplyReverb(preset)}
            >
              <Text style={[styles.presetText, selectedReverb === preset && styles.presetTextActive]}>{preset}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.sliderBlock}>
        <View style={styles.sliderHeaderRow}>
          <Text style={styles.presetTitle}>Preamp</Text>
          <Text style={styles.sliderValue}>{preamp.toFixed(1)} dB</Text>
        </View>
        <Pressable
          onLayout={(event) => setPreampWidth(event.nativeEvent.layout.width)}
          onPress={(event) => updateSliderValue(onUpdatePreamp, preampWidth, event.nativeEvent.locationX)}
          style={styles.sliderTrack}
        >
          <View style={[styles.sliderFill, { width: `${getSliderDisplay(preamp)}%` }]} />
          <View style={[styles.sliderThumb, { left: `${getSliderDisplay(preamp)}%` }]} />
        </Pressable>
      </View>

      <View style={styles.sliderBlock}>
        <View style={styles.sliderHeaderRow}>
          <Text style={styles.presetTitle}>Bass Boost</Text>
          <Text style={styles.sliderValue}>{bassBoost.toFixed(1)} dB</Text>
        </View>
        <Pressable
          onLayout={(event) => setBassBoostWidth(event.nativeEvent.layout.width)}
          onPress={(event) => updateSliderValue(onUpdateBassBoost, bassBoostWidth, event.nativeEvent.locationX)}
          style={styles.sliderTrack}
        >
          <View style={[styles.sliderFill, { width: `${getSliderDisplay(bassBoost)}%` }]} />
          <View style={[styles.sliderThumb, { left: `${getSliderDisplay(bassBoost)}%` }]} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  equalizerPage: { paddingHorizontal: 18, paddingBottom: 28 },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 16 },
  settingsHeaderTitle: { color: C.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  headerBackButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A221F', borderWidth: 1, borderColor: '#243228', alignItems: 'center', justifyContent: 'center' },
  headerActionBadge: { width: 52, height: 38, borderRadius: 16, backgroundColor: '#1A221F', borderWidth: 1, borderColor: '#243228', alignItems: 'center', justifyContent: 'center' },
  eqVisualWrap: { marginTop: 8, marginBottom: 12, paddingTop: 12, paddingBottom: 10, borderRadius: 18, backgroundColor: '#0F1412' },
  eqBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10, minHeight: 210 },
  eqBarColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 },
  eqValue: { color: '#A3B0AB', fontSize: 10, marginBottom: 6 },
  eqBarTrack: { width: 12, borderRadius: 6, backgroundColor: '#2E3936', justifyContent: 'flex-end', overflow: 'hidden' },
  eqBarFill: { width: '100%', borderRadius: 6, backgroundColor: C.green },
  eqFreq: { color: '#A3B0AB', fontSize: 11, marginTop: 8 },
  presetSection: { marginTop: 14, marginBottom: 4 },
  presetRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  presetTitle: { color: C.text, fontSize: 20, fontWeight: '700' },
  savePresetButton: { minHeight: 34, borderRadius: 12, backgroundColor: '#1D2A24', paddingHorizontal: 14, justifyContent: 'center' },
  savePresetText: { color: C.green, fontSize: 12, fontWeight: '700' },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetChip: { flexBasis: '48%', minHeight: 42, borderRadius: 12, backgroundColor: '#1D2421', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A312E' },
  presetChipActive: { backgroundColor: C.green },
  presetText: { color: '#EAEDEB', fontSize: 15, fontWeight: '600' },
  presetTextActive: { color: '#09110F' },
  sliderBlock: { marginTop: 18 },
  sliderHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sliderValue: { color: '#D9E0DD', fontSize: 16, fontWeight: '600' },
  sliderTrack: { height: 12, borderRadius: 10, backgroundColor: '#2E3936', position: 'relative', justifyContent: 'center', overflow: 'hidden' },
  sliderFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.green, borderRadius: 10 },
  sliderThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F2F5F3', position: 'absolute', top: -5, transform: [{ translateX: -11 }], borderWidth: 1, borderColor: '#A7B6B0' },
});
