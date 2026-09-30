import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_THEME } from '../../../constants/theme';

const C = APP_THEME;

export default function ImportsScreen({ importing, onImportMusicFiles, accent }) {
  const importSources = [
    { title: 'Computer', subtitle: 'Using Wi-Fi', icon: 'desktop-outline', color: '#55B9FF', message: 'Computer transfer is not available yet.' },
    { title: 'iPhone/iPad/iPod', subtitle: 'Transfer tracks', icon: 'phone-portrait-outline', color: '#E27777', message: 'Use Files to select audio stored on this device.' },
    { title: 'Android', subtitle: 'Android iOS file share', icon: 'phone-portrait-outline', color: '#20C875', message: 'Use Files to select audio stored on this device.' },
    { title: 'Files', subtitle: 'Import tracks from files', icon: 'folder', color: '#58AEFF', onPress: onImportMusicFiles },
    { title: 'Apple Music', subtitle: 'Import tracks from apple music', icon: 'musical-note', color: '#E85A9B', message: 'Apple Music tracks cannot be imported directly. Choose audio files from Files.' },
    { title: 'Dropbox', subtitle: 'Tap to sign in', icon: 'logo-dropbox', color: '#3987FF', message: 'Dropbox import is not available yet.' },
    { title: 'Google Drive', subtitle: 'Tap to sign in', icon: 'triangle-outline', color: '#4A9C69', message: 'Google Drive import is not available yet.' },
    { title: 'OneDrive', subtitle: 'Tap to sign in', icon: 'cloud', color: '#2878E8', message: 'OneDrive import is not available yet.' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.importPage}>
      <View style={styles.importHeader}><Text style={[styles.importTitle, { color: accent || C.green }]}>Import</Text></View>
      {importSources.map((source) => (
        <Pressable
          key={source.title}
          accessibilityRole="button"
          accessibilityLabel={`${source.title}, ${source.subtitle}`}
          disabled={source.title === 'Files' && importing}
          onPress={source.onPress || (() => Alert.alert(source.title, source.message))}
          style={({ pressed }) => [styles.importSource, pressed && styles.pressed]}
        >
          <View style={styles.importSourceIcon}>
            {source.title === 'Files' && importing ? <ActivityIndicator color={source.color} /> : <Ionicons name={source.icon} size={39} color={source.color} />}
          </View>
          <View style={styles.importSourceText}>
            <Text style={styles.importSourceTitle}>{source.title}</Text>
            <Text style={styles.importSourceSubtitle}>{source.title === 'Files' && importing ? 'Importing tracks…' : source.subtitle}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  importPage: { paddingHorizontal: 16, paddingBottom: 20 },
  importHeader: { height: 88, alignItems: 'center', justifyContent: 'center' },
  importTitle: { fontSize: 23, fontWeight: '700' },
  importSource: { minHeight: 96, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 17, borderWidth: 1, borderColor: '#176B39', backgroundColor: '#050706', flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  importSourceIcon: { width: 68, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  importSourceText: { flex: 1 },
  importSourceTitle: { color: C.text, fontSize: 20, fontWeight: '500' },
  importSourceSubtitle: { color: '#D2D7D4', fontSize: 15, marginTop: 2 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
