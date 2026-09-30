import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import {
    formatDuration,
    importAudioFiles,
    loadFavorites,
    loadPlaylists,
    removeImportedTrack,
    saveFavorites,
    savePlaylists,
    scanDeviceMusic,
} from '../data/musicLibrary';

const C = {
    background: '#090B0A',
    surface: '#141816',
    surfaceRaised: '#1A201D',
    border: '#262D29',
    green: '#67E59B',
    text: '#F2F5F3',
    secondary: '#A0AAA4',
    dim: '#68716C',
    danger: '#F07E77',
};

const TABS = [
    { key: 'Tracks', icon: 'musical-notes-outline' },
    { key: 'Playlists', icon: 'list-outline' },
    { key: 'Albums', icon: 'albums-outline' },
    { key: 'Import', icon: 'add-circle-outline' },
    { key: 'Settings', icon: 'settings-outline' },
];

function IconButton({ name, onPress, size = 22, color = C.text, style, accessibilityLabel }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel || name}
            onPress={onPress}
            style={({ pressed }) => [styles.iconButton, style, pressed && styles.pressed]}
        >
            <Ionicons name={name} size={size} color={color} />
        </Pressable>
    );
}

function Artwork({ size = 58, iconSize, tint = C.green, rounded = 15 }) {
    return (
        <View style={[styles.artwork, { width: size, height: size, borderRadius: rounded }]}>
            <View style={styles.artworkGlow} />
            <Ionicons name="musical-notes" size={iconSize || size * 0.46} color={tint} />
        </View>
    );
}

function TrackRow({ track, index, onPress, onMore, favorite, onFavorite }) {
    return (
        <View style={styles.trackRow}>
            <Pressable onPress={onPress} style={styles.trackMain} accessibilityRole="button" accessibilityLabel={`Play ${track.title}`}>
                <Artwork size={56} />
                <View style={styles.trackText}>
                    <Text numberOfLines={1} style={styles.trackTitle}>{track.title}</Text>
                    <Text numberOfLines={1} style={styles.trackSubtitle}>{track.artist}  ·  {track.album}</Text>
                </View>
            </Pressable>
            <View style={styles.trackMeta}>
                <Text style={styles.trackDuration}>{track.duration ? formatDuration(track.duration) : '--:--'}</Text>
                {favorite ? <IconButton
                    name="heart"
                    color={C.green}
                    size={20}
                    onPress={onFavorite}
                    accessibilityLabel="Remove from favorites"
                /> : null}
                <IconButton
                    name="ellipsis-horizontal"
                    color={C.secondary}
                    size={20}
                    onPress={onMore}
                    accessibilityLabel="Track options"
                />
            </View>
        </View>
    );
}

function EmptyState({ icon, title, detail, action, onAction, busy, busyText = 'Scanning library', secondaryAction, onSecondaryAction }) {
    return (
        <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Ionicons name={icon} size={34} color={C.green} /></View>
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptyDetail}>{detail}</Text>
            {action ? (
                <Pressable onPress={onAction} style={styles.primaryButton}>
                    {busy ? <ActivityIndicator color={C.background} /> : <Ionicons name="scan-outline" size={18} color={C.background} />}
                    <Text style={styles.primaryButtonText}>{busy ? busyText : action}</Text>
                </Pressable>
            ) : null}
            {secondaryAction ? (
                <Pressable onPress={onSecondaryAction} style={styles.secondaryButton}>
                    <Ionicons name="folder-open-outline" size={17} color={C.green} />
                    <Text style={styles.secondaryButtonText}>{secondaryAction}</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

export default function PlayerScreen() {
    const [tracks, setTracks] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [activeTab, setActiveTab] = useState('Tracks');
    const [activeTrack, setActiveTrack] = useState(null);
    const [queue, setQueue] = useState([]);
    const [showNowPlaying, setShowNowPlaying] = useState(false);
    const [trackOptionsTrack, setTrackOptionsTrack] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [showPlaylistCreator, setShowPlaylistCreator] = useState(false);
    const [playlistName, setPlaylistName] = useState('');
    const [permissionGranted, setPermissionGranted] = useState(null);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');
    const [autoPlay, setAutoPlay] = useState(false);
    const [scrubWidth, setScrubWidth] = useState(1);
    const [accent, setAccent] = useState(C.green);

    const player = useAudioPlayer(activeTrack?.uri || null, { updateInterval: 400 });
    const status = useAudioPlayerStatus(player);

    useEffect(() => {
        setAudioModeAsync({ playsInSilentMode: true }).catch(() => { });
        Promise.all([loadPlaylists(), loadFavorites()]).then(([storedPlaylists, storedFavorites]) => {
            setPlaylists(storedPlaylists);
            setFavorites(storedFavorites);
        });
        scanLibrary();
    }, []);

    useEffect(() => {
        if (autoPlay && status.isLoaded) {
            player.play();
            setAutoPlay(false);
        }
    }, [autoPlay, player, status.isLoaded]);

    async function scanLibrary() {
        setLoading(true);
        setError('');
        try {
            const result = await scanDeviceMusic();
            setPermissionGranted(result.permissionGranted);
            setTracks(result.tracks);
        } catch (scanError) {
            setError(scanError?.message || 'Music library could not be opened.');
        } finally {
            setLoading(false);
        }
    }

    async function importMusicFiles() {
        setImporting(true);
        setError('');
        try {
            const { additions, skipped, canceled } = await importAudioFiles();
            if (additions.length) {
                setTracks((current) => [...current, ...additions].sort((a, b) => a.title.localeCompare(b.title)));
            }
            if (!canceled && skipped) {
                Alert.alert(
                    additions.length ? 'Import complete' : 'Already imported',
                    additions.length
                        ? `Added ${additions.length} ${additions.length === 1 ? 'track' : 'tracks'}; skipped ${skipped} duplicate ${skipped === 1 ? 'file' : 'files'}.`
                        : `${skipped === 1 ? 'This file is' : 'These files are'} already in your library.`,
                );
            }
        } catch (importError) {
            Alert.alert('Could not import audio', importError?.message || 'Choose an audio file stored in Files and try again.');
        } finally {
            setImporting(false);
        }
    }

    const filteredTracks = useMemo(() => {
        let source = tracks;
        if (activeTab === 'Playlists' && selectedPlaylist) {
            source = tracks.filter((track) => selectedPlaylist.trackIds.includes(track.id));
        }
        if (search.trim()) {
            const query = search.toLowerCase();
            source = source.filter((track) => `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(query));
        }
        return source;
    }, [activeTab, search, selectedPlaylist, tracks]);

    const albums = useMemo(() => {
        const groups = new Map();
        tracks.forEach((track) => {
            const name = track.album || 'Unknown album';
            if (!groups.has(name)) groups.set(name, []);
            groups.get(name).push(track);
        });
        return Array.from(groups, ([name, albumTracks]) => ({ name, tracks: albumTracks }));
    }, [tracks]);

    function playTrack(track, playQueue = tracks) {
        setQueue(playQueue.length ? playQueue : tracks);
        setActiveTrack(track);
        setAutoPlay(true);
    }

    function togglePlay() {
        if (status.playing) player.pause();
        else if (activeTrack) player.play();
        else if (tracks[0]) playTrack(tracks[0]);
    }

    function playNext(direction = 1) {
        const source = queue.length ? queue : tracks;
        if (!source.length) return;
        const currentIndex = source.findIndex((track) => track.id === activeTrack?.id);
        const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + source.length) % source.length;
        playTrack(source[nextIndex], source);
    }

    async function toggleFavorite(track) {
        const next = favorites.includes(track.id)
            ? favorites.filter((id) => id !== track.id)
            : [...favorites, track.id];
        setFavorites(next);
        await saveFavorites(next);
    }

    function createPlaylist() {
        setPlaylistName('');
        setShowPlaylistCreator(true);
    }

    async function commitPlaylist() {
        const cleanName = playlistName.trim();
        if (!cleanName) return;
        const next = [...playlists, { id: `${Date.now()}`, name: cleanName, trackIds: [] }];
        setPlaylists(next);
        await savePlaylists(next);
        setShowPlaylistCreator(false);
    }

    async function addTrackToPlaylist(track, playlist) {
        const next = playlists.map((item) => item.id === playlist.id
            ? { ...item, trackIds: item.trackIds.includes(track.id) ? item.trackIds : [...item.trackIds, track.id] }
            : item);
        setPlaylists(next);
        await savePlaylists(next);
    }

    function showTrackOptions(track) {
        setTrackOptionsTrack(track);
    }

    function getTrackOptionItems(track) {
        const options = [
            { text: 'Play next', onPress: () => playTrack(track, [track, ...tracks.filter((item) => item.id !== track.id)]) },
            { text: favorites.includes(track.id) ? 'Remove from favorites' : 'Add to favorites', onPress: () => toggleFavorite(track) },
        ];
        if (track.source === 'files' || track.id?.startsWith('import:')) options.push({
            text: 'Remove from imports',
            destructive: true,
            onPress: async () => {
                await removeImportedTrack(track.id);
                setTracks((current) => current.filter((item) => item.id !== track.id));
                if (activeTrack?.id === track.id) {
                    player.pause();
                    setActiveTrack(null);
                }
            },
        });
        playlists.forEach((playlist) => options.push({
            text: `Add to ${playlist.name}`,
            onPress: () => addTrackToPlaylist(track, playlist),
        }));
        return options;
    }

    function onSeek(event) {
        const duration = status.duration || activeTrack?.duration || 0;
        if (!duration) return;
        const ratio = Math.min(1, Math.max(0, event.nativeEvent.locationX / scrubWidth));
        player.seekTo(ratio * duration).catch(() => { });
    }

    function renderTrackList(items) {
        return (
            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <TrackRow
                        track={item}
                        index={index}
                        onPress={() => playTrack(item, items)}
                        onMore={() => showTrackOptions(item)}
                        favorite={favorites.includes(item.id)}
                        onFavorite={() => toggleFavorite(item)}
                    />
                )}
                contentContainerStyle={styles.trackListContent}
                ListEmptyComponent={(
                    <EmptyState
                        icon={activeTab === 'Playlists' ? 'list-outline' : 'musical-notes-outline'}
                        title={loading ? 'Finding your music' : error ? 'Library unavailable' : 'No tracks here yet'}
                        detail={loading ? 'Scanning audio stored on this device.' : error || 'Allow audio access or add songs to your device library.'}
                        action={!loading && !error ? 'Scan device again' : undefined}
                        busy={loading}
                        onAction={scanLibrary}
                        secondaryAction={!loading && !error ? 'Import from Files' : undefined}
                        onSecondaryAction={importMusicFiles}
                    />
                )}
            />
        );
    }

    function renderTracks() {
        if (loading && tracks.length === 0) {
            return <EmptyState icon="radio-outline" title="Finding your music" detail="Scanning audio stored on this device." busy />;
        }
        if (permissionGranted === false && tracks.length === 0) {
            return <EmptyState icon="lock-closed-outline" title="Music access is off" detail="Allow audio access to scan the device library, or import individual songs from Files." action="Request access" onAction={scanLibrary} secondaryAction="Import from Files" onSecondaryAction={importMusicFiles} />;
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
                        playTrack(shuffled[0], shuffled);
                    }}>
                        <Ionicons name="shuffle" size={19} color={C.background} />
                        <Text style={styles.shuffleText}>Shuffle play</Text>
                    </Pressable>
                    <IconButton name="search" size={19} color={C.secondary} onPress={() => setSearchOpen(true)} style={styles.searchToggle} accessibilityLabel="Search tracks" />
                    <IconButton name="refresh" size={19} color={C.secondary} onPress={scanLibrary} style={styles.searchToggle} accessibilityLabel="Rescan device music" />
                </View>
                {renderTrackList(filteredTracks)}
            </>
        );
    }

    function renderPlaylists() {
        if (selectedPlaylist) {
            return (
                <>
                    <View style={styles.detailHeader}>
                        <IconButton name="arrow-back" color={C.text} onPress={() => setSelectedPlaylist(null)} accessibilityLabel="Back to playlists" />
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
                    <IconButton name="add" color={C.background} onPress={createPlaylist} style={styles.addButton} />
                </View>
                <Pressable style={styles.favoritePlaylist} onPress={() => setSelectedPlaylist({ id: 'favorites', name: 'Liked tracks', trackIds: favorites })}>
                    <View style={styles.favoriteArt}><Ionicons name="heart" size={25} color={C.background} /></View>
                    <View style={styles.flexOne}><Text style={styles.cardTitle}>Liked tracks</Text><Text style={styles.cardSub}>{favorites.length} saved songs</Text></View>
                    <Ionicons name="chevron-forward" size={19} color={C.secondary} />
                </Pressable>
                {playlists.map((playlist, index) => (
                    <Pressable key={playlist.id} style={styles.playlistRow} onPress={() => setSelectedPlaylist(playlist)}>
                        <Artwork size={62} tint={index % 2 ? '#D2A7FF' : '#83C9F4'} />
                        <View style={styles.flexOne}><Text style={styles.cardTitle}>{playlist.name}</Text><Text style={styles.cardSub}>{playlist.trackIds.length} songs</Text></View>
                        <IconButton name="ellipsis-horizontal" color={C.secondary} onPress={() => Alert.alert(playlist.name, 'Remove this playlist?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => { const next = playlists.filter((item) => item.id !== playlist.id); setPlaylists(next); await savePlaylists(next); } }])} />
                    </Pressable>
                ))}
                {playlists.length === 0 ? <Text style={styles.helperText}>Make a playlist from any track’s options menu.</Text> : null}
            </ScrollView>
        );
    }

    function renderAlbums() {
        return (
            <ScrollView contentContainerStyle={styles.pageContent}>
                <View style={styles.libraryHero}>
                    <View><Text style={styles.eyebrow}>ORGANIZED BY ALBUM</Text><Text style={styles.heroTitle}>Albums</Text></View>
                    <Text style={styles.trackCount}>{albums.length} albums</Text>
                </View>
                {albums.length ? (
                    <View style={styles.albumGrid}>
                        {albums.map((album, index) => (
                            <Pressable key={album.name} style={styles.albumCard} onPress={() => {
                                setSelectedPlaylist({ id: `album-${album.name}`, name: album.name, trackIds: album.tracks.map((track) => track.id) });
                                setActiveTab('Playlists');
                            }}>
                                <Artwork size={156} iconSize={58} rounded={18} tint={index % 3 === 0 ? C.green : index % 3 === 1 ? '#D2A7FF' : '#83C9F4'} />
                                <Text numberOfLines={1} style={styles.albumTitle}>{album.name}</Text>
                                <Text style={styles.cardSub}>{album.tracks.length} tracks</Text>
                            </Pressable>
                        ))}
                    </View>
                ) : (
                    <EmptyState icon="albums-outline" title="No albums yet" detail="Scan your device music library to find albums." action="Scan device" onAction={scanLibrary} busy={loading} />
                )}
            </ScrollView>
        );
    }

    function renderImports() {
        const importSources = [
            { title: 'Computer', subtitle: 'Using Wi-Fi', icon: 'desktop-outline', color: '#55B9FF', message: 'Computer transfer is not available yet.' },
            { title: 'iPhone/iPad/iPod', subtitle: 'Transfer tracks', icon: 'phone-portrait-outline', color: '#E27777', message: 'Use Files to select audio stored on this device.' },
            { title: 'Android', subtitle: 'Android iOS file share', icon: 'phone-portrait-outline', color: '#20C875', message: 'Use Files to select audio stored on this device.' },
            { title: 'Files', subtitle: 'Import tracks from files', icon: 'folder', color: '#58AEFF', onPress: importMusicFiles },
            { title: 'Apple Music', subtitle: 'Import tracks from apple music', icon: 'musical-note', color: '#E85A9B', message: 'Apple Music tracks cannot be imported directly. Choose audio files from Files.' },
            { title: 'Dropbox', subtitle: 'Tap to sign in', icon: 'logo-dropbox', color: '#3987FF', message: 'Dropbox import is not available yet.' },
            { title: 'Google Drive', subtitle: 'Tap to sign in', icon: 'triangle-outline', color: '#4A9C69', message: 'Google Drive import is not available yet.' },
            { title: 'OneDrive', subtitle: 'Tap to sign in', icon: 'cloud', color: '#2878E8', message: 'OneDrive import is not available yet.' },
        ];
        return (
            <ScrollView contentContainerStyle={styles.importPage}>
                <View style={styles.importHeader}><Text style={[styles.importTitle, { color: accent }]}>Import</Text></View>
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
                            {source.title === 'Files' && importing
                                ? <ActivityIndicator color={source.color} />
                                : <Ionicons name={source.icon} size={39} color={source.color} />}
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

    function renderSettings() {
        return (
            <ScrollView contentContainerStyle={styles.pageContent}>
                <View style={styles.libraryHero}><View><Text style={styles.eyebrow}>MAKE IT YOURS</Text><Text style={styles.heroTitle}>Settings</Text></View></View>
                <Text style={styles.settingLabel}>ACCENT COLOR</Text>
                <View style={styles.accentRow}>
                    {[C.green, '#8BCAFF', '#D2A7FF', '#FF9C83', '#FFD36D'].map((color) => (
                        <Pressable key={color} onPress={() => setAccent(color)} style={[styles.accentSwatch, { backgroundColor: color }, accent === color && styles.accentSelected]} />
                    ))}
                </View>
                <Text style={styles.settingLabel}>MUSIC LIBRARY</Text>
                <View style={styles.settingCard}>
                    <View style={styles.settingIcon}><Ionicons name="musical-notes-outline" size={19} color={accent} /></View>
                    <View style={styles.flexOne}><Text style={styles.cardTitle}>Device audio</Text><Text style={styles.cardSub}>{permissionGranted ? `${tracks.length} tracks found` : 'Audio-only access'}</Text></View>
                    <Pressable onPress={scanLibrary} style={styles.smallAction}><Text style={styles.smallActionText}>{loading ? 'Scanning' : 'Rescan'}</Text></Pressable>
                </View>
                {permissionGranted === false ? <Text style={styles.helperText}>Audio access was declined. Enable media access in iPhone Settings to scan your library.</Text> : null}
                <Text style={styles.settingLabel}>ABOUT</Text>
                <View style={styles.settingCard}>
                    <View style={[styles.settingIcon, { backgroundColor: '#1F2D25' }]}><Ionicons name="waveform" size={19} color={accent} /></View>
                    <View style={styles.flexOne}><Text style={styles.cardTitle}>Wave Music</Text><Text style={styles.cardSub}>A home for your sound</Text></View>
                    <Text style={styles.version}>57</Text>
                </View>
            </ScrollView>
        );
    }

    function renderNowPlaying() {
        if (!activeTrack) return null;
        const current = status.currentTime || 0;
        const duration = status.duration || activeTrack.duration || 1;
        return (
            <View style={styles.nowPlaying}>
                <View style={styles.nowTop}>
                    <IconButton name="chevron-down" color={C.text} onPress={() => setShowNowPlaying(false)} style={styles.headerIcon} accessibilityLabel="Close player" />
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
                    <View style={styles.flexOne}>
                        <Text numberOfLines={1} style={styles.nowTitle}>{activeTrack.title}</Text>
                        <Text numberOfLines={1} style={[styles.nowArtist, { color: accent }]}>{activeTrack.artist}  ·  {activeTrack.album}</Text>
                    </View>
                    <IconButton name={favorites.includes(activeTrack.id) ? 'heart' : 'heart-outline'} color={favorites.includes(activeTrack.id) ? accent : C.secondary} size={25} onPress={() => toggleFavorite(activeTrack)} accessibilityLabel="Like track" />
                </View>
                <Pressable onLayout={(event) => setScrubWidth(event.nativeEvent.layout.width)} onPress={onSeek} style={styles.seekTrack}>
                    <View style={[styles.seekProgress, { width: `${Math.min(100, (current / duration) * 100)}%`, backgroundColor: accent }]} />
                    <View style={[styles.seekThumb, { left: `${Math.min(99, (current / duration) * 100)}%`, backgroundColor: accent }]} />
                </Pressable>
                <View style={styles.timeLabels}><Text style={styles.timeLabel}>{formatDuration(current)}</Text><Text style={styles.timeLabel}>{formatDuration(Math.max(0, duration - current))}</Text></View>
                {status.error ? <Text style={styles.playbackError}>{status.error}</Text> : null}
                <View style={styles.transport}>
                    <IconButton name="play-skip-back" size={26} color={C.secondary} onPress={() => playNext(-1)} accessibilityLabel="Previous track" />
                    <Pressable style={({ pressed }) => [styles.playButton, { backgroundColor: accent }, pressed && styles.pressed]} onPress={togglePlay} accessibilityRole="button" accessibilityLabel={status.playing ? 'Pause' : 'Play'}>
                        <Ionicons name={status.playing ? 'pause' : 'play'} size={34} color={C.background} style={!status.playing ? { marginLeft: 4 } : undefined} />
                    </Pressable>
                    <IconButton name="play-skip-forward" size={26} color={C.secondary} onPress={() => playNext(1)} accessibilityLabel="Next track" />
                </View>
                <View style={styles.nowFooter}>
                    <Ionicons name="list-outline" size={19} color={C.secondary} />
                    <Text style={styles.nowFooterText}>{queue.length || tracks.length} tracks in queue</Text>
                    <Ionicons name="volume-medium-outline" size={20} color={C.secondary} />
                </View>
            </View>
        );
    }

    if (showNowPlaying && activeTrack) return renderNowPlaying();

    return (
        <View style={styles.screen}>
            <View style={styles.topBar}>
                <View style={styles.brandDot}><Ionicons name="pulse" size={18} color={C.background} /></View>
                <View style={styles.flexOne}><Text style={styles.brandName}>WAVE</Text><Text style={styles.brandCaption}>YOUR MUSIC, YOUR CURRENT</Text></View>
                <IconButton name="person-circle-outline" color={C.secondary} onPress={() => setActiveTab('Settings')} accessibilityLabel="Open settings" />
            </View>
            <View style={styles.content}>
                {activeTab === 'Tracks' ? renderTracks() : null}
                {activeTab === 'Playlists' ? renderPlaylists() : null}
                {activeTab === 'Albums' ? renderAlbums() : null}
                {activeTab === 'Import' ? renderImports() : null}
                {activeTab === 'Settings' ? renderSettings() : null}
            </View>
            {activeTrack ? (
                <Pressable style={styles.miniPlayer} onPress={() => setShowNowPlaying(true)} accessibilityRole="button" accessibilityLabel="Open now playing">
                    <Artwork size={44} iconSize={21} rounded={12} tint={accent} />
                    <View style={styles.miniText}><Text numberOfLines={1} style={styles.miniTitle}>{activeTrack.title}</Text><Text numberOfLines={1} style={styles.miniSubtitle}>{activeTrack.artist}</Text></View>
                    <IconButton name={status.playing ? 'pause' : 'play'} color={accent} size={23} onPress={togglePlay} accessibilityLabel={status.playing ? 'Pause' : 'Play'} />
                    <IconButton name="play-skip-forward" color={C.text} size={21} onPress={() => playNext(1)} accessibilityLabel="Next track" />
                </Pressable>
            ) : null}
            <View style={styles.tabBar}>
                {TABS.map((tab) => {
                    const active = activeTab === tab.key;
                    return (
                        <Pressable key={tab.key} style={styles.tab} onPress={() => { setActiveTab(tab.key); setSelectedPlaylist(null); }} accessibilityRole="tab" accessibilityState={{ selected: active }}>
                            <Ionicons name={active ? tab.icon.replace('-outline', '') : tab.icon} size={21} color={active ? accent : C.dim} />
                            <Text style={[styles.tabText, active && { color: accent }]}>{tab.key}</Text>
                        </Pressable>
                    );
                })}
            </View>
            <Modal transparent visible={showPlaylistCreator} animationType="fade" onRequestClose={() => setShowPlaylistCreator(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.createModal}>
                        <Text style={styles.modalEyebrow}>YOUR COLLECTION</Text>
                        <Text style={styles.modalTitle}>New playlist</Text>
                        <TextInput
                            autoFocus
                            value={playlistName}
                            onChangeText={setPlaylistName}
                            onSubmitEditing={commitPlaylist}
                            placeholder="Playlist name"
                            placeholderTextColor={C.dim}
                            returnKeyType="done"
                            style={styles.playlistInput}
                        />
                        <View style={styles.modalActions}>
                            <Pressable onPress={() => setShowPlaylistCreator(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
                            <Pressable onPress={commitPlaylist} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Create</Text></Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal transparent visible={!!trackOptionsTrack} animationType="fade" onRequestClose={() => setTrackOptionsTrack(null)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.trackOptionsModal}>
                        <Text numberOfLines={1} style={styles.trackOptionsTitle}>{trackOptionsTrack?.title}</Text>
                        <Text style={styles.trackOptionsSubtitle}>Track options</Text>
                        <ScrollView style={styles.trackOptionsList}>
                            {trackOptionsTrack ? getTrackOptionItems(trackOptionsTrack).map((option) => (
                                <Pressable
                                    key={option.text}
                                    onPress={() => {
                                        setTrackOptionsTrack(null);
                                        option.onPress();
                                    }}
                                    style={({ pressed }) => [styles.trackOption, pressed && styles.pressed]}
                                >
                                    <Text style={[styles.trackOptionText, option.destructive && styles.trackOptionDestructive]}>{option.text}</Text>
                                </Pressable>
                            )) : null}
                        </ScrollView>
                        <Pressable onPress={() => setTrackOptionsTrack(null)} style={styles.trackOptionsCancel}>
                            <Text style={styles.trackOptionsCancelText}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    content: { flex: 1 },
    flexOne: { flex: 1 },
    topBar: { minHeight: 70, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    brandDot: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
    brandName: { color: C.text, fontSize: 17, fontWeight: '800', letterSpacing: 2.4 },
    brandCaption: { color: C.dim, fontSize: 9, letterSpacing: 1.25, marginTop: 2 },
    iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
    pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
    libraryHero: { minHeight: 96, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    tracksHero: { minHeight: 44, paddingHorizontal: 22, paddingVertical: 7, justifyContent: 'center' },
    importButton: { minHeight: 40, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: '#365441', backgroundColor: '#18251D', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 2 },
    importButtonText: { color: C.green, fontSize: 12, fontWeight: '700' },
    importPage: { paddingHorizontal: 16, paddingBottom: 20 },
    importHeader: { height: 88, alignItems: 'center', justifyContent: 'center' },
    importTitle: { fontSize: 23, fontWeight: '700' },
    importSource: { minHeight: 96, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 17, borderWidth: 1, borderColor: '#176B39', backgroundColor: '#050706', flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    importSourceIcon: { width: 68, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    importSourceText: { flex: 1 },
    importSourceTitle: { color: C.text, fontSize: 20, fontWeight: '500' },
    importSourceSubtitle: { color: '#D2D7D4', fontSize: 15, marginTop: 2 },
    eyebrow: { color: C.dim, fontSize: 10, fontWeight: '700', letterSpacing: 1.6, marginBottom: 7 },
    heroTitle: { color: C.text, fontSize: 29, fontWeight: '700', letterSpacing: 0 },
    trackCount: { color: C.secondary, fontSize: 12, marginBottom: 5 },
    actionRow: { flexDirection: 'row', gap: 9, paddingHorizontal: 16, paddingBottom: 13 },
    shuffleButton: { flex: 1, minHeight: 46, backgroundColor: C.green, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
    shuffleText: { color: C.background, fontSize: 14, fontWeight: '700' },
    searchToggle: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    searchField: { marginHorizontal: 16, marginBottom: 12, height: 46, borderRadius: 13, paddingHorizontal: 13, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 8 },
    searchInput: { flex: 1, color: C.text, fontSize: 14 },
    trackListContent: { paddingHorizontal: 16, paddingBottom: 20 },
    trackRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1A201D', gap: 8 },
    trackMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 9 },
    trackText: { flex: 1, minWidth: 0 },
    trackTitle: { color: C.text, fontSize: 14, fontWeight: '600' },
    trackSubtitle: { color: C.secondary, fontSize: 11, marginTop: 5 },
    trackMeta: { flexDirection: 'row', alignItems: 'center', gap: 1 },
    trackDuration: { color: C.dim, fontSize: 11, width: 38, textAlign: 'right' },
    artwork: { backgroundColor: '#1A2420', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    artworkGlow: { position: 'absolute', width: '140%', height: '140%', borderRadius: 100, top: '42%', backgroundColor: '#24372D', opacity: 0.75 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, paddingVertical: 52 },
    emptyIcon: { width: 74, height: 74, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18211C', marginBottom: 19 },
    emptyTitle: { color: C.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
    emptyDetail: { color: C.secondary, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 9, maxWidth: 290 },
    primaryButton: { marginTop: 22, paddingHorizontal: 18, minHeight: 45, borderRadius: 14, backgroundColor: C.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
    primaryButtonText: { color: C.background, fontSize: 13, fontWeight: '700' },
    secondaryButton: { marginTop: 14, minHeight: 42, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
    secondaryButtonText: { color: C.green, fontSize: 13, fontWeight: '600' },
    pageContent: { paddingHorizontal: 20, paddingBottom: 24 },
    addButton: { backgroundColor: C.green, width: 40, height: 40, borderRadius: 20 },
    favoritePlaylist: { minHeight: 83, padding: 12, borderRadius: 17, backgroundColor: '#18211C', flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 10 },
    favoriteArt: { width: 58, height: 58, borderRadius: 13, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
    playlistRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: 1, borderBottomColor: C.border },
    cardTitle: { color: C.text, fontSize: 14, fontWeight: '600' },
    cardSub: { color: C.secondary, fontSize: 11, marginTop: 5 },
    helperText: { color: C.dim, fontSize: 12, lineHeight: 19, paddingTop: 17 },
    detailHeader: { paddingHorizontal: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
    sectionTitle: { color: C.text, fontSize: 22, fontWeight: '700' },
    albumGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingTop: 4 },
    albumCard: { width: '48%', marginBottom: 22 },
    albumTitle: { color: C.text, fontSize: 13, fontWeight: '600', marginTop: 10 },
    settingLabel: { color: C.dim, fontSize: 10, fontWeight: '700', letterSpacing: 1.35, marginTop: 18, marginBottom: 10 },
    accentRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 4 },
    accentSwatch: { width: 31, height: 31, borderRadius: 16 },
    accentSelected: { borderWidth: 3, borderColor: C.text, transform: [{ scale: 1.08 }] },
    settingCard: { minHeight: 72, paddingHorizontal: 12, borderRadius: 15, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#1C2821', alignItems: 'center', justifyContent: 'center' },
    smallAction: { minHeight: 34, paddingHorizontal: 13, borderRadius: 11, backgroundColor: '#20392B', justifyContent: 'center' },
    smallActionText: { color: C.green, fontSize: 12, fontWeight: '700' },
    version: { color: C.dim, fontSize: 12 },
    miniPlayer: { height: 66, marginHorizontal: 12, marginBottom: 9, paddingHorizontal: 10, borderRadius: 17, backgroundColor: '#202823', borderWidth: 1, borderColor: '#364239', flexDirection: 'row', alignItems: 'center', gap: 7 },
    miniText: { flex: 1, minWidth: 0, paddingHorizontal: 5 },
    miniTitle: { color: C.text, fontSize: 12, fontWeight: '600' },
    miniSubtitle: { color: C.secondary, fontSize: 10, marginTop: 4 },
    tabBar: { height: 69, paddingHorizontal: 7, paddingBottom: 4, backgroundColor: '#111513', borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    tab: { flex: 1, height: 58, alignItems: 'center', justifyContent: 'center', gap: 4 },
    tabText: { color: C.dim, fontSize: 10, fontWeight: '600' },
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
    seekTrack: { height: 26, justifyContent: 'center', marginTop: 11 },
    seekProgress: { height: 4, borderRadius: 3, backgroundColor: C.green },
    seekThumb: { position: 'absolute', width: 12, height: 12, borderRadius: 6, marginLeft: -6 },
    timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 },
    timeLabel: { color: C.dim, fontSize: 10 },
    playbackError: { color: C.danger, fontSize: 11, textAlign: 'center', marginTop: 8 },
    transport: { height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
    playButton: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
    nowFooter: { height: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border },
    nowFooterText: { color: C.secondary, fontSize: 11 },
    modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#000000B8' },
    createModal: { padding: 21, borderRadius: 20, backgroundColor: C.surfaceRaised, borderWidth: 1, borderColor: C.border },
    trackOptionsModal: { maxHeight: '78%', padding: 20, borderRadius: 20, backgroundColor: C.surfaceRaised, borderWidth: 1, borderColor: C.border },
    trackOptionsTitle: { color: C.text, fontSize: 18, fontWeight: '700' },
    trackOptionsSubtitle: { color: C.secondary, fontSize: 12, marginTop: 5, marginBottom: 10 },
    trackOptionsList: { flexGrow: 0 },
    trackOption: { minHeight: 48, justifyContent: 'center', borderTopWidth: 1, borderTopColor: C.border },
    trackOptionText: { color: C.text, fontSize: 14 },
    trackOptionDestructive: { color: C.danger },
    trackOptionsCancel: { minHeight: 45, marginTop: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#252D28' },
    trackOptionsCancelText: { color: C.text, fontSize: 14, fontWeight: '600' },
    modalEyebrow: { color: C.green, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
    modalTitle: { color: C.text, fontSize: 22, fontWeight: '700', marginTop: 7 },
    playlistInput: { height: 48, color: C.text, fontSize: 14, marginTop: 17, paddingHorizontal: 13, borderRadius: 12, backgroundColor: C.background, borderWidth: 1, borderColor: C.border },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 11, marginTop: 17 },
    cancelButton: { minHeight: 43, justifyContent: 'center', paddingHorizontal: 14 },
    cancelText: { color: C.secondary, fontSize: 13, fontWeight: '600' },
});
