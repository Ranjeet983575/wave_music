import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_THEME } from '../../../constants/theme';
import { Artwork, EmptyState, IconButton, TrackRow } from '../../common';

const C = APP_THEME;

export default function TracksScreen({
  tracks,
  loading,
  permissionGranted,
  error,
  searchOpen,
  search,
  setSearch,
  setSearchOpen,
  onScanLibrary,
  onImportMusicFiles,
  onPlayTrack,
  favorites,
  toggleFavorite,
  filteredTracks,
  accent,
}) {
  function renderTrackList(items) {
    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrackRow
            track={item}
            onPress={() => onPlayTrack(item, items)}
            onMore={() => { }}
            favorite={favorites.includes(item.id)}
            onFavorite={() => toggleFavorite(item)}
            stylesOverride={styles}
          />
        )}
        contentContainerStyle={styles.trackListContent}
        ListEmptyComponent={(
          <EmptyState
            icon="musical-notes-outline"
            title={loading ? 'Finding your music' : error ? 'Library unavailable' : 'No tracks here yet'}
            detail={loading ? 'Scanning audio stored on this device.' : error || 'Allow audio access or add songs to your device library.'}
            action={!loading && !error ? 'Scan device again' : undefined}
            busy={loading}
            onAction={onScanLibrary}
            secondaryAction={!loading && !error ? 'Import from Files' : undefined}
            onSecondaryAction={onImportMusicFiles}
            stylesOverride={styles}
          />
        )}
      />
    );
  }

  if (loading && tracks.length === 0) {
    return <EmptyState icon="radio-outline" title="Finding your music" detail="Scanning audio stored on this device." busy stylesOverride={styles} />;
  }

  if (permissionGranted === false && tracks.length === 0) {
    return (
      <EmptyState
        icon="lock-closed-outline"
        title="Music access is off"
        detail="Allow audio access to scan the device library, or import individual songs from Files."
        action="Request access"
        onAction={onScanLibrary}
        secondaryAction="Import from Files"
        onSecondaryAction={onImportMusicFiles}
        stylesOverride={styles}
      />
    );
  }

  return (
    <>
      <View style={styles.tracksHero}>
        <Text style={styles.trackCount}>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</Text>
      </View>
      {searchOpen ? (
        <View style={styles.searchField}>
          <Ionicons name="search" size={18} color={C.secondary} />
          <TextInput
            autoFocus
            value={search}
            onChangeText={setSearch}
            placeholder="Search tracks, artists, albums"
            placeholderTextColor={C.dim}
            style={styles.searchInput}
          />
          <IconButton name="close" color={C.secondary} onPress={() => { setSearch(''); setSearchOpen(false); }} />
        </View>
      ) : null}
      <View style={styles.actionRow}>
        <Pressable style={styles.shuffleButton} onPress={() => {
          if (!tracks.length) return;
          const shuffled = [...tracks].sort(() => Math.random() - 0.5);
          onPlayTrack(shuffled[0], shuffled);
        }}>
          <Ionicons name="shuffle" size={19} color={C.background} />
          <Text style={styles.shuffleText}>Shuffle play</Text>
        </Pressable>
        <IconButton name="search" size={19} color={C.secondary} onPress={() => setSearchOpen(true)} style={styles.searchToggle} accessibilityLabel="Search tracks" />
        <IconButton name="refresh" size={19} color={C.secondary} onPress={onScanLibrary} style={styles.searchToggle} accessibilityLabel="Rescan device music" />
      </View>
      {renderTrackList(filteredTracks)}
    </>
  );
}

const styles = StyleSheet.create({
  tracksHero: { minHeight: 44, paddingHorizontal: 22, paddingVertical: 7, justifyContent: 'center' },
  trackCount: { color: C.secondary, fontSize: 12, marginBottom: 5 },
  actionRow: { flexDirection: 'row', gap: 9, paddingHorizontal: 16, paddingBottom: 13 },
  shuffleButton: { flex: 1, minHeight: 46, backgroundColor: C.green, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  shuffleText: { color: C.background, fontSize: 14, fontWeight: '700' },
  searchToggle: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  searchField: { marginHorizontal: 16, marginBottom: 12, height: 46, borderRadius: 13, paddingHorizontal: 13, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, color: C.text, fontSize: 14 },
  trackListContent: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, paddingVertical: 52 },
  emptyIcon: { width: 74, height: 74, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18211C', marginBottom: 19 },
  emptyTitle: { color: C.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  emptyDetail: { color: C.secondary, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 9, maxWidth: 290 },
  primaryButton: { marginTop: 22, paddingHorizontal: 18, minHeight: 45, borderRadius: 14, backgroundColor: C.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { color: C.background, fontSize: 13, fontWeight: '700' },
  secondaryButton: { marginTop: 14, minHeight: 42, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
  secondaryButtonText: { color: C.green, fontSize: 13, fontWeight: '600' },
  trackRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1A201D', gap: 8 },
  trackMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 9 },
  trackText: { flex: 1, minWidth: 0 },
  trackTitle: { color: C.text, fontSize: 14, fontWeight: '600' },
  trackSubtitle: { color: C.secondary, fontSize: 11, marginTop: 5 },
  trackMeta: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  trackDuration: { color: C.dim, fontSize: 11, width: 38, textAlign: 'right' },
});
