import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { APP_THEME } from '../../constants/theme';
import { Artwork, IconButton } from '../../components/common';

const C = APP_THEME;

export default function PlaylistsScreen({
  selectedPlaylist,
  favorites,
  playlists,
  tracks,
  onBack,
  setSelectedPlaylist,
  onCreatePlaylist,
  onSavePlaylists,
  onPlayTrack,
  filteredTracks,
  renderTrackList,
}) {
  if (selectedPlaylist) {
    return (
      <>
        <View style={styles.detailHeader}>
          <IconButton name="arrow-back" color={C.text} onPress={onBack} accessibilityLabel="Back to playlists" />
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>PLAYLIST</Text>
            <Text style={styles.sectionTitle}>{selectedPlaylist.name}</Text>
          </View>
          <Text style={styles.trackCount}>{selectedPlaylist.trackIds.length} songs</Text>
        </View>
        {renderTrackList(filteredTracks)}
      </>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <View style={styles.libraryHero}>
        <View><Text style={styles.eyebrow}>MADE FOR YOU</Text><Text style={styles.heroTitle}>Playlists</Text></View>
        <IconButton name="add" color={C.background} onPress={onCreatePlaylist} style={styles.addButton} />
      </View>
      <Pressable style={styles.favoritePlaylist} onPress={() => setSelectedPlaylist({ id: 'favorites', name: 'Liked tracks', trackIds: favorites })}>
        <View style={styles.favoriteArt}><Text style={styles.favoriteIcon}>♥</Text></View>
        <View style={{ flex: 1 }}><Text style={styles.cardTitle}>Liked tracks</Text><Text style={styles.cardSub}>{favorites.length} saved songs</Text></View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      {playlists.map((playlist, index) => (
        <Pressable key={playlist.id} style={styles.playlistRow} onPress={() => setSelectedPlaylist(playlist)}>
          <Artwork size={62} tint={index % 2 ? '#D2A7FF' : '#83C9F4'} />
          <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{playlist.name}</Text><Text style={styles.cardSub}>{playlist.trackIds.length} songs</Text></View>
          <IconButton
            name="ellipsis-horizontal"
            color={C.secondary}
            onPress={() => Alert.alert(playlist.name, 'Remove this playlist?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: async () => { const next = playlists.filter((item) => item.id !== playlist.id); onSavePlaylists(next); } },
            ])}
          />
        </Pressable>
      ))}
      {playlists.length === 0 ? <Text style={styles.helperText}>Make a playlist from any track’s options menu.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  libraryHero: { minHeight: 96, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { color: C.dim, fontSize: 10, fontWeight: '700', letterSpacing: 1.6, marginBottom: 7 },
  heroTitle: { color: C.text, fontSize: 29, fontWeight: '700' },
  trackCount: { color: C.secondary, fontSize: 12, marginBottom: 5 },
  addButton: { backgroundColor: C.green, width: 40, height: 40, borderRadius: 20 },
  favoritePlaylist: { minHeight: 83, padding: 12, borderRadius: 17, backgroundColor: '#18211C', flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 10 },
  favoriteArt: { width: 58, height: 58, borderRadius: 13, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  favoriteIcon: { color: C.background, fontSize: 24, fontWeight: '700' },
  chevron: { color: C.secondary, fontSize: 24 },
  playlistRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: 1, borderBottomColor: C.border },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: '600' },
  cardSub: { color: C.secondary, fontSize: 11, marginTop: 5 },
  helperText: { color: C.dim, fontSize: 12, lineHeight: 19, paddingTop: 8, paddingHorizontal: 10 },
  detailHeader: { paddingHorizontal: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { color: C.text, fontSize: 22, fontWeight: '700' },
  pageContent: { paddingHorizontal: 20, paddingBottom: 24 },
});
