import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_THEME } from '../../constants/theme';
import { Artwork, IconButton, formatDuration } from '../common';

const C = APP_THEME;

export default function NowPlayingPanel({
  activeTrack,
  status,
  queue,
  tracks,
  accent,
  onClose,
  onTogglePlay,
  onPlayNext,
  onSeek,
  onShowQueue,
  onShowVolume,
  onToggleFavorite,
  favorites,
  showQueue,
  setShowQueue,
  showVolume,
  setShowVolume,
  volume,
  updateVolume,
  onVolumePress,
  setScrubWidth,
  setVolumeBarWidth,
  player,
  playTrack,
  setShowNowPlaying,
  showTrackOptions,
}) {
  if (!activeTrack) return null;

  const current = status.currentTime || 0;
  const duration = status.duration || activeTrack.duration || 1;

  return (
    <View style={styles.nowPlaying}>
      <View style={styles.nowTop}>
        <IconButton name="chevron-down" color={C.text} onPress={onClose} style={styles.headerIcon} accessibilityLabel="Close player" />
        <View style={{ flex: 1, alignItems: 'center' }}><Text style={styles.nowEyebrow}>NOW PLAYING</Text><Text style={styles.nowContext}>From {queue.length ? 'your library' : 'Wave Music'}</Text></View>
        <IconButton name="ellipsis-horizontal" color={C.text} onPress={() => showTrackOptions(activeTrack)} style={styles.headerIcon} accessibilityLabel="Track options" />
      </View>
      <View style={styles.largeArtworkFrame}>
        <View style={[styles.largeArtwork, { borderColor: `${accent}35` }]}>
          <View style={[styles.largeArtworkGlow, { backgroundColor: accent }]} />
          <Ionicons name="musical-notes" size={112} color={accent} />
          <View style={styles.artworkIndex}><Text style={styles.artworkIndexText}>W</Text></View>
        </View>
      </View>
      <View style={styles.nowInfo}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.nowTitle}>{activeTrack.title}</Text>
          <Text numberOfLines={1} style={[styles.nowArtist, { color: accent }]}>{activeTrack.artist}  ·  {activeTrack.album}</Text>
        </View>
        <IconButton name={favorites.includes(activeTrack.id) ? 'heart' : 'heart-outline'} color={favorites.includes(activeTrack.id) ? accent : C.secondary} size={25} onPress={() => onToggleFavorite(activeTrack)} accessibilityLabel="Like track" />
      </View>
      <Pressable onLayout={(event) => setScrubWidth(event.nativeEvent.layout.width)} onPress={onSeek} style={styles.seekTrack}>
        <View style={styles.seekBackground} />
        <View style={[styles.seekProgress, { width: `${Math.min(100, (current / duration) * 100)}%`, backgroundColor: accent }]} />
        <View style={[styles.seekThumb, { left: `${Math.min(99, (current / duration) * 100)}%`, backgroundColor: accent }]} />
      </Pressable>
      <View style={styles.timeLabels}><Text style={styles.timeLabel}>{formatDuration(current)}</Text><Text style={styles.timeLabel}>{formatDuration(Math.max(0, duration - current))}</Text></View>
      {status.error ? <Text style={styles.playbackError}>{status.error}</Text> : null}
      <View style={styles.transport}>
        <IconButton name="play-skip-back" size={26} color={C.secondary} onPress={() => onPlayNext(-1)} accessibilityLabel="Previous track" />
        <Pressable style={({ pressed }) => [styles.playButton, { backgroundColor: accent }, pressed && styles.pressed]} onPress={onTogglePlay} accessibilityRole="button" accessibilityLabel={status.playing ? 'Pause' : 'Play'}>
          <Ionicons name={status.playing ? 'pause' : 'play'} size={34} color={C.background} style={!status.playing ? { marginLeft: 4 } : undefined} />
        </Pressable>
        <IconButton name="play-skip-forward" size={26} color={C.secondary} onPress={() => onPlayNext(1)} accessibilityLabel="Next track" />
      </View>
      <View style={styles.nowFooter}>
        <Pressable onPress={() => setShowQueue(true)} style={styles.footerControl} accessibilityRole="button" accessibilityLabel="Show playback queue">
          <Ionicons name="list-outline" size={19} color={C.secondary} />
        </Pressable>
        <Pressable onPress={() => setShowQueue(true)} accessibilityRole="button" accessibilityLabel="Show playback queue">
          <Text style={styles.nowFooterText}>{queue.length || tracks.length} tracks in queue</Text>
        </Pressable>
        <Pressable onPress={() => setShowVolume(true)} style={styles.footerControl} accessibilityRole="button" accessibilityLabel="Adjust playback volume">
          <Ionicons name={volume === 0 ? 'volume-mute-outline' : volume < 0.5 ? 'volume-low-outline' : 'volume-medium-outline'} size={20} color={C.secondary} />
        </Pressable>
      </View>
      <Modal transparent visible={showQueue} animationType="fade" onRequestClose={() => setShowQueue(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.utilityModal}>
            <Text style={styles.utilityTitle}>Playback queue</Text>
            <ScrollView style={styles.queueList}>
              {(queue.length ? queue : tracks).map((track, index) => (
                <Pressable key={`${track.id}-${index}`} onPress={() => { setShowQueue(false); playTrack(track, queue.length ? queue : tracks); }} style={styles.queueItem}>
                  <Ionicons name={track.id === activeTrack.id ? 'volume-high' : 'musical-note'} size={17} color={track.id === activeTrack.id ? accent : C.secondary} />
                  <View style={styles.queueItemText}>
                    <Text numberOfLines={1} style={[styles.queueTrackTitle, track.id === activeTrack.id && { color: accent }]}>{track.title}</Text>
                    <Text numberOfLines={1} style={styles.queueTrackArtist}>{track.artist}</Text>
                  </View>
                </Pressable>
              ))}
              {!(queue.length || tracks.length) ? <Text style={styles.queueEmpty}>No tracks in queue</Text> : null}
            </ScrollView>
            <Pressable onPress={() => setShowQueue(false)} style={styles.trackOptionsCancel}><Text style={styles.trackOptionsCancelText}>Done</Text></Pressable>
          </View>
        </View>
      </Modal>
      <Modal transparent visible={showVolume} animationType="fade" onRequestClose={() => setShowVolume(false)}>
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
            <Pressable onPress={() => setShowVolume(false)} style={styles.trackOptionsCancel}><Text style={styles.trackOptionsCancelText}>Done</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  nowPlaying: { flex: 1, backgroundColor: C.background, paddingHorizontal: 22, paddingTop: 4, paddingBottom: 10 },
  nowTop: { minHeight: 60, flexDirection: 'row', alignItems: 'center' },
  headerIcon: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  nowEyebrow: { color: C.text, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  nowContext: { color: C.dim, fontSize: 10, marginTop: 4 },
  largeArtworkFrame: { flex: 1, minHeight: 250, maxHeight: 440, justifyContent: 'center', paddingVertical: 18 },
  largeArtwork: { flex: 1, minHeight: 250, borderRadius: 24, backgroundColor: '#121A16', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1 },
  largeArtworkGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, opacity: 0.08 },
  artworkIndex: { position: 'absolute', bottom: 16, right: 18, width: 29, height: 29, borderRadius: 10, backgroundColor: '#FFFFFF0D', alignItems: 'center', justifyContent: 'center' },
  artworkIndexText: { color: C.secondary, fontSize: 12, fontWeight: '800' },
  nowInfo: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nowTitle: { color: C.text, fontSize: 19, fontWeight: '700' },
  nowArtist: { fontSize: 12, marginTop: 6 },
  seekTrack: { height: 26, justifyContent: 'center', marginTop: 11, position: 'relative' },
  seekBackground: { position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 2, backgroundColor: '#3A443E' },
  seekProgress: { height: 3, borderRadius: 2, backgroundColor: C.green },
  seekThumb: { position: 'absolute', width: 12, height: 12, borderRadius: 6, marginLeft: -6 },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 },
  timeLabel: { color: C.dim, fontSize: 10 },
  playbackError: { color: C.danger, fontSize: 11, textAlign: 'center', marginTop: 8 },
  transport: { height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  playButton: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  nowFooter: { height: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border },
  footerControl: { minWidth: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  nowFooterText: { color: C.secondary, fontSize: 11 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#000000B8' },
  utilityModal: { maxHeight: '78%', padding: 20, borderRadius: 20, backgroundColor: C.surfaceRaised, borderWidth: 1, borderColor: C.border },
  utilityTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  queueList: { flexGrow: 0 },
  queueItem: { minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderTopColor: C.border },
  queueItemText: { flex: 1 },
  queueTrackTitle: { color: C.text, fontSize: 13, fontWeight: '600' },
  queueTrackArtist: { color: C.secondary, fontSize: 11, marginTop: 3 },
  queueEmpty: { color: C.secondary, paddingVertical: 18 },
  volumeControl: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12 },
  volumeStep: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  volumeBar: { flex: 1, height: 32, justifyContent: 'center' },
  volumeBarBackground: { position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: '#3A443E' },
  volumeBarFill: { height: 4, borderRadius: 2 },
  volumeValue: { color: C.secondary, fontSize: 12, textAlign: 'center', marginTop: 4 },
  trackOptionsCancel: { minHeight: 45, marginTop: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#252D28' },
  trackOptionsCancelText: { color: C.text, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
