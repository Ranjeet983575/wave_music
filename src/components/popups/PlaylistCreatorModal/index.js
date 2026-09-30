import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { APP_THEME } from '../../../constants/theme';

const C = APP_THEME;

export default function PlaylistCreatorModal({ visible, playlistName, setPlaylistName, onClose, onCommit }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.createModal}>
          <Text style={styles.modalEyebrow}>YOUR COLLECTION</Text>
          <Text style={styles.modalTitle}>New playlist</Text>
          <TextInput
            autoFocus
            value={playlistName}
            onChangeText={setPlaylistName}
            onSubmitEditing={onCommit}
            placeholder="Playlist name"
            placeholderTextColor={C.dim}
            returnKeyType="done"
            style={styles.playlistInput}
          />
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
            <Pressable onPress={onCommit} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Create</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#000000B8' },
  createModal: { padding: 21, borderRadius: 20, backgroundColor: C.surfaceRaised, borderWidth: 1, borderColor: C.border },
  modalEyebrow: { color: C.green, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  modalTitle: { color: C.text, fontSize: 22, fontWeight: '700', marginTop: 7 },
  playlistInput: { height: 48, color: C.text, fontSize: 14, marginTop: 17, paddingHorizontal: 13, borderRadius: 12, backgroundColor: C.background, borderWidth: 1, borderColor: C.border },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 11, marginTop: 17 },
  cancelButton: { minHeight: 43, justifyContent: 'center', paddingHorizontal: 14 },
  cancelText: { color: C.secondary, fontSize: 13, fontWeight: '600' },
  primaryButton: { marginTop: 22, paddingHorizontal: 18, minHeight: 45, borderRadius: 14, backgroundColor: C.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { color: C.background, fontSize: 13, fontWeight: '700' },
});
