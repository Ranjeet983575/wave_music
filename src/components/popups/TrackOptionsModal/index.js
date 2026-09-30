import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { APP_THEME } from '../../../constants/theme';

const C = APP_THEME;

export default function TrackOptionsModal({ visible, track, options, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.trackOptionsModal}>
          <Text numberOfLines={1} style={styles.trackOptionsTitle}>{track?.title}</Text>
          <Text style={styles.trackOptionsSubtitle}>Track options</Text>
          <ScrollView style={styles.trackOptionsList}>
            {track ? options.map((option) => (
              <Pressable
                key={option.text}
                onPress={() => {
                  onClose();
                  option.onPress();
                }}
                style={({ pressed }) => [styles.trackOption, pressed && styles.pressed]}
              >
                <Text style={[styles.trackOptionText, option.destructive && styles.trackOptionDestructive]}>{option.text}</Text>
              </Pressable>
            )) : null}
          </ScrollView>
          <Pressable onPress={onClose} style={styles.trackOptionsCancel}>
            <Text style={styles.trackOptionsCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#000000B8' },
  trackOptionsModal: { maxHeight: '78%', padding: 20, borderRadius: 20, backgroundColor: C.surfaceRaised, borderWidth: 1, borderColor: C.border },
  trackOptionsTitle: { color: C.text, fontSize: 18, fontWeight: '700' },
  trackOptionsSubtitle: { color: C.secondary, fontSize: 12, marginTop: 5, marginBottom: 10 },
  trackOptionsList: { flexGrow: 0 },
  trackOption: { minHeight: 48, justifyContent: 'center', borderTopWidth: 1, borderTopColor: C.border },
  trackOptionText: { color: C.text, fontSize: 14 },
  trackOptionDestructive: { color: C.danger },
  trackOptionsCancel: { minHeight: 45, marginTop: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#252D28' },
  trackOptionsCancelText: { color: C.text, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
