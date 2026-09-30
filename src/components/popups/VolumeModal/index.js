import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_THEME } from '../../../constants/theme';

const C = APP_THEME;

export default function VolumeModal({ visible, volume, accent, onClose, updateVolume, setVolumeBarWidth, onVolumePress }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.utilityModal}>
          <Text style={styles.utilityTitle}>Playback volume</Text>
          <View style={styles.volumeControl}>
            <Pressable onPress={() => updateVolume(volume - 0.1)} style={styles.volumeStep} accessibilityRole="button" accessibilityLabel="Decrease volume">
              <Ionicons name="remove" size={20} color={C.text} />
            </Pressable>
            <Pressable
              onLayout={(event) => setVolumeBarWidth(event.nativeEvent.layout.width)}
              onPress={onVolumePress}
              accessibilityRole="adjustable"
              accessibilityLabel="Playback volume"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(volume * 100) }}
              style={styles.volumeBar}
            >
              <View style={styles.volumeBarBackground} />
              <View style={[styles.volumeBarFill, { width: `${volume * 100}%`, backgroundColor: accent }]} />
            </Pressable>
            <Pressable onPress={() => updateVolume(volume + 0.1)} style={styles.volumeStep} accessibilityRole="button" accessibilityLabel="Increase volume">
              <Ionicons name="add" size={20} color={C.text} />
            </Pressable>
          </View>
          <Text style={styles.volumeValue}>{Math.round(volume * 100)}%</Text>
          <Pressable onPress={onClose} style={styles.trackOptionsCancel}><Text style={styles.trackOptionsCancelText}>Done</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#000000B8' },
  utilityModal: { maxHeight: '78%', padding: 20, borderRadius: 20, backgroundColor: C.surfaceRaised, borderWidth: 1, borderColor: C.border },
  utilityTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  volumeControl: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12 },
  volumeStep: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  volumeBar: { flex: 1, height: 32, justifyContent: 'center' },
  volumeBarBackground: { position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: '#3A443E' },
  volumeBarFill: { height: 4, borderRadius: 2 },
  volumeValue: { color: C.secondary, fontSize: 12, textAlign: 'center', marginTop: 4 },
  trackOptionsCancel: { minHeight: 45, marginTop: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#252D28' },
  trackOptionsCancelText: { color: C.text, fontSize: 14, fontWeight: '600' },
});
