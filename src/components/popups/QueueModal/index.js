import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_THEME } from '../../../constants/theme';

const C = APP_THEME;

export default function QueueModal({ visible, queue, tracks, activeTrack, accent, onClose, onSelectTrack }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.utilityModal}>
          <Text style={styles.utilityTitle}>Playback queue</Text>
          <ScrollView style={styles.queueList}>
            {(queue.length ? queue : tracks).map((track, index) => (
              <Pressable key={`${track.id}-${index}`} onPress={() => { onClose(); onSelectTrack(track); }} style={styles.queueItem}>
                <Ionicons name={track.id === activeTrack.id ? 'volume-high' : 'musical-note'} size={17} color={track.id === activeTrack.id ? accent : C.secondary} />
                <View style={styles.queueItemText}>
                  <Text numberOfLines={1} style={[styles.queueTrackTitle, track.id === activeTrack.id && { color: accent }]}>{track.title}</Text>
                  <Text numberOfLines={1} style={styles.queueTrackArtist}>{track.artist}</Text>
                </View>
              </Pressable>
            ))}
            {!(queue.length || tracks.length) ? <Text style={styles.queueEmpty}>No tracks in queue</Text> : null}
          </ScrollView>
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
  queueList: { flexGrow: 0 },
  queueItem: { minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderTopColor: C.border },
  queueItemText: { flex: 1 },
  queueTrackTitle: { color: C.text, fontSize: 13, fontWeight: '600' },
  queueTrackArtist: { color: C.secondary, fontSize: 11, marginTop: 3 },
  queueEmpty: { color: C.secondary, paddingVertical: 18 },
  trackOptionsCancel: { minHeight: 45, marginTop: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#252D28' },
  trackOptionsCancelText: { color: C.text, fontSize: 14, fontWeight: '600' },
});
