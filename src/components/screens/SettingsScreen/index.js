import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_THEME } from '../../../constants/theme';
import { ToggleSwitch } from '../../common';

const C = APP_THEME;

export default function SettingsScreen({
  equalizerEnabled,
  setEqualizerEnabled,
  audioFocusEnabled,
  setAudioFocusEnabled,
  libraryAutoScan,
  setLibraryAutoScan,
  smartImportEnabled,
  setSmartImportEnabled,
  permissionGranted,
  tracks,
  loading,
  accent,
  themeMode,
  setThemeMode,
  setAccent,
  onOpenEqualizer,
  onScanLibrary,
  onImportMusicFiles,
}) {
  const themeOptions = ['Light', 'Dark', 'System'];
  const accentOptions = [C.green, '#8BCAFF', '#D2A7FF', '#FF9C83', '#FFD36D'];

  return (
    <ScrollView contentContainerStyle={styles.settingsPage} showsVerticalScrollIndicator={false}>
      <View style={styles.settingsHeader}>
        <Text style={styles.settingsHeaderTitle}>Settings</Text>
        <Pressable style={styles.headerActionBadge} accessibilityRole="button" accessibilityLabel="Quick actions">
          <Ionicons name="sparkles-outline" size={18} color={C.green} />
        </Pressable>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionCaption}>Playback</Text>
        <Pressable style={styles.settingRow} onPress={onOpenEqualizer}>
          <View style={styles.settingRowIcon}><Ionicons name="options-outline" size={20} color={C.green} /></View>
          <View style={styles.settingRowText}>
            <Text style={styles.settingRowTitle}>Equalizer</Text>
            <Text style={styles.settingRowDescription}>{equalizerEnabled ? 'Custom tune enabled' : 'Disabled'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.secondary} />
        </Pressable>

        <Pressable style={styles.settingRow} onPress={() => Alert.alert('Advanced settings', 'Crossfade, playback smoothing and auto-optimization are enabled for a seamless listening experience.')}>
          <View style={styles.settingRowIcon}><Ionicons name="construct-outline" size={20} color={C.green} /></View>
          <View style={styles.settingRowText}>
            <Text style={styles.settingRowTitle}>Advanced settings</Text>
            <Text style={styles.settingRowDescription}>Fine controls for playback</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.secondary} />
        </Pressable>

        <Pressable style={styles.settingRow} onPress={() => setAudioFocusEnabled((value) => !value)}>
          <View style={styles.settingRowIcon}><Ionicons name="volume-medium-outline" size={20} color={C.green} /></View>
          <View style={styles.settingRowText}>
            <Text style={styles.settingRowTitle}>Audio focus</Text>
            <Text style={styles.settingRowDescription}>{audioFocusEnabled ? 'Adaptive volume on' : 'Adaptive volume off'}</Text>
          </View>
          <ToggleSwitch enabled={audioFocusEnabled} onToggle={() => setAudioFocusEnabled((value) => !value)} />
        </Pressable>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionCaption}>Appearance</Text>
        <View style={styles.segmentedRow}>
          {themeOptions.map((option) => (
            <Pressable
              key={option}
              style={[styles.segmentButton, themeMode === option && styles.segmentButtonActive]}
              onPress={() => setThemeMode(option)}
            >
              <Text style={[styles.segmentText, themeMode === option && styles.segmentTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.inlineLabel}>Accent color</Text>
        <View style={styles.accentRow}>
          {accentOptions.map((color) => (
            <Pressable
              key={color}
              onPress={() => setAccent(color)}
              style={[styles.accentSwatch, { backgroundColor: color }, accent === color && styles.accentSelected]}
            />
          ))}
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionCaption}>Library</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingIcon}><Ionicons name="musical-notes-outline" size={18} color={accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Device library</Text>
            <Text style={styles.cardSub}>{permissionGranted ? `${tracks.length} tracks available` : 'Access media files on this device'}</Text>
          </View>
          <Pressable onPress={onScanLibrary} style={styles.smallAction}>
            <Text style={styles.smallActionText}>{loading ? 'Scanning' : 'Rescan'}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.settingRow} onPress={() => setLibraryAutoScan((value) => !value)}>
          <View style={styles.settingRowIcon}><Ionicons name="scan-outline" size={20} color={C.green} /></View>
          <View style={styles.settingRowText}>
            <Text style={styles.settingRowTitle}>Auto scan</Text>
            <Text style={styles.settingRowDescription}>{libraryAutoScan ? 'On' : 'Off'}</Text>
          </View>
          <ToggleSwitch enabled={libraryAutoScan} onToggle={() => setLibraryAutoScan((value) => !value)} />
        </Pressable>

        <Pressable style={styles.settingRow} onPress={() => setSmartImportEnabled((value) => !value)}>
          <View style={styles.settingRowIcon}><Ionicons name="folder-open-outline" size={20} color={C.green} /></View>
          <View style={styles.settingRowText}>
            <Text style={styles.settingRowTitle}>Smart import</Text>
            <Text style={styles.settingRowDescription}>{smartImportEnabled ? 'Organize automatically' : 'Ask before importing'}</Text>
          </View>
          <ToggleSwitch enabled={smartImportEnabled} onToggle={() => setSmartImportEnabled((value) => !value)} />
        </Pressable>

        <Pressable style={styles.settingRow} onPress={onImportMusicFiles}>
          <View style={styles.settingRowIcon}><Ionicons name="add-circle-outline" size={20} color={C.green} /></View>
          <View style={styles.settingRowText}>
            <Text style={styles.settingRowTitle}>Import music</Text>
            <Text style={styles.settingRowDescription}>Files and local audio</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.secondary} />
        </Pressable>
      </View>

      {permissionGranted === false ? (
        <Text style={styles.helperText}>Audio access was declined. Enable media access in iPhone Settings to scan your library.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  settingsPage: { paddingHorizontal: 18, paddingBottom: 28 },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 16 },
  settingsHeaderTitle: { color: C.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  headerActionBadge: { width: 52, height: 38, borderRadius: 16, backgroundColor: '#1A221F', borderWidth: 1, borderColor: '#243228', alignItems: 'center', justifyContent: 'center' },
  settingsSection: { backgroundColor: '#141914', borderRadius: 22, borderWidth: 1, borderColor: '#232B27', paddingVertical: 8, paddingHorizontal: 10, marginBottom: 18 },
  sectionCaption: { color: '#93A19B', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 10, paddingTop: 12, paddingBottom: 8 },
  settingRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14 },
  settingRowIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#171E1B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27312D' },
  settingRowText: { flex: 1, minWidth: 0 },
  settingRowTitle: { color: C.text, fontSize: 17, fontWeight: '600' },
  settingRowDescription: { color: C.secondary, fontSize: 12, marginTop: 3 },
  segmentedRow: { flexDirection: 'row', backgroundColor: '#1C241F', borderRadius: 14, padding: 4, marginHorizontal: 4, marginBottom: 10 },
  segmentButton: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  segmentButtonActive: { backgroundColor: C.green },
  segmentText: { fontSize: 12, fontWeight: '700', color: '#D7DDD9', letterSpacing: 0.7 },
  segmentTextActive: { color: '#0B120F' },
  inlineLabel: { color: '#A9B3AE', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8 },
  accentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingBottom: 12 },
  accentSwatch: { width: 30, height: 30, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  accentSelected: { borderColor: '#F3F5F2', transform: [{ scale: 1.08 }] },
  settingCard: { minHeight: 72, paddingHorizontal: 12, marginHorizontal: 4, borderRadius: 16, backgroundColor: '#1A201D', borderWidth: 1, borderColor: '#2A302E', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  settingIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#18251C', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: '600' },
  cardSub: { color: C.secondary, fontSize: 11, marginTop: 5 },
  smallAction: { minHeight: 34, paddingHorizontal: 12, borderRadius: 11, backgroundColor: '#1E372A', justifyContent: 'center' },
  smallActionText: { color: C.green, fontSize: 12, fontWeight: '700' },
  helperText: { color: C.dim, fontSize: 12, lineHeight: 19, paddingTop: 8, paddingHorizontal: 10 },
});
