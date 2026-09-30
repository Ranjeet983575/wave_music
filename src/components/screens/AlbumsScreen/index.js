import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { APP_THEME } from '../../../constants/theme';
import { Artwork, EmptyState } from '../../common';

const C = APP_THEME;

export default function AlbumsScreen({ albums, loading, onScanLibrary, onSelectAlbum }) {
  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <View style={styles.libraryHero}>
        <View><Text style={styles.eyebrow}>ORGANIZED BY ALBUM</Text><Text style={styles.heroTitle}>Albums</Text></View>
        <Text style={styles.trackCount}>{albums.length} albums</Text>
      </View>
      {albums.length ? (
        <View style={styles.albumGrid}>
          {albums.map((album, index) => (
            <Pressable key={album.name} style={styles.albumCard} onPress={() => onSelectAlbum(album)}>
              <Artwork size={156} iconSize={58} rounded={18} tint={index % 3 === 0 ? C.green : index % 3 === 1 ? '#D2A7FF' : '#83C9F4'} />
              <Text numberOfLines={1} style={styles.albumTitle}>{album.name}</Text>
              <Text style={styles.cardSub}>{album.tracks.length} tracks</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState icon="albums-outline" title="No albums yet" detail="Scan your device music library to find albums." action="Scan device" onAction={onScanLibrary} busy={loading} stylesOverride={styles} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContent: { paddingHorizontal: 20, paddingBottom: 24 },
  libraryHero: { minHeight: 96, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { color: C.dim, fontSize: 10, fontWeight: '700', letterSpacing: 1.6, marginBottom: 7 },
  heroTitle: { color: C.text, fontSize: 29, fontWeight: '700' },
  trackCount: { color: C.secondary, fontSize: 12, marginBottom: 5 },
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingTop: 4 },
  albumCard: { width: '48%', marginBottom: 22 },
  albumTitle: { color: C.text, fontSize: 13, fontWeight: '600', marginTop: 10 },
  cardSub: { color: C.secondary, fontSize: 11, marginTop: 5 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, paddingVertical: 52 },
  emptyIcon: { width: 74, height: 74, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18211C', marginBottom: 19 },
  emptyTitle: { color: C.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  emptyDetail: { color: C.secondary, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 9, maxWidth: 290 },
  primaryButton: { marginTop: 22, paddingHorizontal: 18, minHeight: 45, borderRadius: 14, backgroundColor: C.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { color: C.background, fontSize: 13, fontWeight: '700' },
  secondaryButton: { marginTop: 14, minHeight: 42, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
  secondaryButtonText: { color: C.green, fontSize: 13, fontWeight: '600' },
});
