import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
} from '../../data/musicLibrary';
import { DEFAULT_EQ_LEVELS, DEFAULT_PLAYBACK_SETTINGS, loadPlaybackSettings, savePlaybackSettings } from '../../data/playbackSettings';
import { DEFAULT_APPEARANCE_SETTINGS, loadAppearanceSettings, saveAppearanceSettings } from '../../data/appearanceSettings';
import { ACCENT_COLORS, APP_THEME, LIGHT_THEME } from '../../constants/theme';
import WaveformVisualizer from '../../components/WaveformVisualizer';
import AdvancedSettingsScreen from '../AdvancedSettingsScreen';

const C = APP_THEME;

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

function ToggleSwitch({ enabled, onToggle, activeColor = C.green }) {
    return (
        <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: enabled }}
            onPress={onToggle}
            style={({ pressed }) => [
                styles.togglePill,
                enabled && { backgroundColor: activeColor },
                pressed && styles.pressed,
            ]}
        >
            <View style={[styles.toggleKnob, enabled && styles.toggleKnobActive]} />
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

function TrackRow({ track, index, onPress, onMore, favorite, onFavorite, stylesOverride, accentColor = C.green, secondaryColor = C.secondary }) {
    const rowStyles = stylesOverride || styles;
    return (
        <View style={rowStyles.trackRow}>
            <Pressable onPress={onPress} style={rowStyles.trackMain} accessibilityRole="button" accessibilityLabel={`Play ${track.title}`}>
                <Artwork size={56} tint={accentColor} />
                <View style={rowStyles.trackText}>
                    <Text numberOfLines={1} style={rowStyles.trackTitle}>{track.title}</Text>
                    <Text numberOfLines={1} style={rowStyles.trackSubtitle}>{track.artist}  ·  {track.album}</Text>
                </View>
            </Pressable>
            <View style={rowStyles.trackMeta}>
                <Text style={rowStyles.trackDuration}>{track.duration ? formatDuration(track.duration) : '--:--'}</Text>
                {favorite ? <IconButton
                    name="heart"
                    color={accentColor}
                    size={20}
                    onPress={onFavorite}
                    accessibilityLabel="Remove from favorites"
                /> : null}
                <IconButton
                    name="ellipsis-horizontal"
                    color={secondaryColor}
                    size={20}
                    onPress={onMore}
                    accessibilityLabel="Track options"
                />
            </View>
        </View>
    );
}

function EmptyState({ icon, title, detail, action, onAction, busy, busyText = 'Scanning library', secondaryAction, onSecondaryAction, stylesOverride, accentColor = C.green }) {
    const emptyStyles = stylesOverride || styles;
    return (
        <View style={emptyStyles.emptyState}>
            <View style={emptyStyles.emptyIcon}><Ionicons name={icon} size={34} color={accentColor} /></View>
            <Text style={emptyStyles.emptyTitle}>{title}</Text>
            <Text style={emptyStyles.emptyDetail}>{detail}</Text>
            {action ? (
                <Pressable onPress={onAction} style={emptyStyles.primaryButton}>
                    {busy ? <ActivityIndicator color={C.background} /> : <Ionicons name="scan-outline" size={18} color={C.background} />}
                    <Text style={emptyStyles.primaryButtonText}>{busy ? busyText : action}</Text>
                </Pressable>
            ) : null}
            {secondaryAction ? (
                <Pressable onPress={onSecondaryAction} style={emptyStyles.secondaryButton}>
                    <Ionicons name="folder-open-outline" size={17} color={accentColor} />
                    <Text style={emptyStyles.secondaryButtonText}>{secondaryAction}</Text>
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
    const [showQueue, setShowQueue] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const [volume, setVolume] = useState(1);
    const [volumeBarWidth, setVolumeBarWidth] = useState(1);
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
    const [accent, setAccent] = useState(DEFAULT_APPEARANCE_SETTINGS.accent);
    const [themeMode, setThemeMode] = useState(DEFAULT_APPEARANCE_SETTINGS.themeMode);
    const [appearanceSettingsReady, setAppearanceSettingsReady] = useState(false);
    const [equalizerEnabled, setEqualizerEnabled] = useState(true);
    const [audioFocusEnabled, setAudioFocusEnabled] = useState(true);
    const [libraryAutoScan, setLibraryAutoScan] = useState(true);
    const [smartImportEnabled, setSmartImportEnabled] = useState(false);
    const [settingsView, setSettingsView] = useState('main');
    const [advancedSettings, setAdvancedSettings] = useState(DEFAULT_PLAYBACK_SETTINGS);
    const [advancedSettingsReady, setAdvancedSettingsReady] = useState(false);
    const [eqLevels, setEqLevels] = useState(DEFAULT_EQ_LEVELS);
    const [selectedPreset, setSelectedPreset] = useState('Custom');
    const [selectedReverb, setSelectedReverb] = useState('Off');
    const [preamp, setPreamp] = useState(0);
    const [bassBoost, setBassBoost] = useState(0);
    const [preampWidth, setPreampWidth] = useState(1);
    const [bassBoostWidth, setBassBoostWidth] = useState(1);

    const player = useAudioPlayer(activeTrack?.uri || null, { updateInterval: 400 });
    const status = useAudioPlayerStatus(player);
    const completedTrackRef = useRef(null);
    const isLightTheme = themeMode === 'Light';
    const C = useMemo(() => ({ ...(isLightTheme ? LIGHT_THEME : APP_THEME), green: accent }), [accent, isLightTheme]);
    const styles = useMemo(() => createAppearanceStyles(C, isLightTheme), [C, isLightTheme]);

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

    useEffect(() => {
        let isMounted = true;
        loadPlaybackSettings().then((storedSettings) => {
            if (!isMounted) return;
            setAdvancedSettings(storedSettings);
            setVolume(storedSettings.volume);
            setEqualizerEnabled(storedSettings.equalizerEnabled);
            setAudioFocusEnabled(storedSettings.audioFocusEnabled);
            setLibraryAutoScan(storedSettings.libraryAutoScan);
            setSmartImportEnabled(storedSettings.smartImportEnabled);
            setEqLevels(storedSettings.eqLevels);
            setSelectedPreset(storedSettings.selectedPreset);
            setSelectedReverb(storedSettings.selectedReverb);
            setPreamp(storedSettings.preamp);
            setBassBoost(storedSettings.bassBoost);
            setAdvancedSettingsReady(true);
        });
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        let isMounted = true;
        loadAppearanceSettings().then((storedSettings) => {
            if (!isMounted) return;
            setAccent(storedSettings.accent);
            setThemeMode(storedSettings.themeMode);
            setAppearanceSettingsReady(true);
        });
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (!advancedSettingsReady) return;
        savePlaybackSettings({
            ...advancedSettings,
            volume,
            equalizerEnabled,
            audioFocusEnabled,
            libraryAutoScan,
            smartImportEnabled,
            eqLevels,
            selectedPreset,
            selectedReverb,
            preamp,
            bassBoost,
        });
    }, [
        advancedSettings,
        advancedSettingsReady,
        audioFocusEnabled,
        bassBoost,
        equalizerEnabled,
        eqLevels,
        libraryAutoScan,
        preamp,
        selectedPreset,
        selectedReverb,
        smartImportEnabled,
        volume,
    ]);

    useEffect(() => {
        if (appearanceSettingsReady) saveAppearanceSettings({ accent, themeMode });
    }, [accent, appearanceSettingsReady, themeMode]);

    useEffect(() => {
        if (!status.isLoaded) return;
        player.shouldCorrectPitch = advancedSettings.pitchCorrection;
        player.setPlaybackRate(advancedSettings.playbackRate);
    }, [advancedSettings.pitchCorrection, advancedSettings.playbackRate, player, status.isLoaded]);

    useEffect(() => {
        const limitedVolume = Math.min(volume, advancedSettings.volumeLimit);
        if (limitedVolume !== volume) setVolume(limitedVolume);
        player.volume = limitedVolume;
    }, [advancedSettings.volumeLimit, player, volume]);

    useEffect(() => {
        if (!status.didJustFinish) {
            completedTrackRef.current = null;
            return;
        }
        if (!activeTrack || completedTrackRef.current === activeTrack.id) return;
        const source = queue.length ? queue : tracks;
        const currentIndex = source.findIndex((track) => track.id === activeTrack.id);
        const canAdvance = advancedSettings.shuffleEnabled
            ? source.length > 1
            : currentIndex >= 0 && currentIndex < source.length - 1;
        if (!advancedSettings.repeatAllEnabled && !(advancedSettings.autoPlayNext && canAdvance)) return;
        const nextTrack = playNext(1);
        completedTrackRef.current = nextTrack?.id || activeTrack.id;
    }, [activeTrack, advancedSettings.autoPlayNext, advancedSettings.repeatAllEnabled, advancedSettings.shuffleEnabled, queue, status.didJustFinish, tracks]);

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

    function triggerPlaybackHaptic(isPlaying) {
        if (!advancedSettings.hapticsEnabled) return;
        const feedback = Platform.OS === 'android'
            ? Haptics.performAndroidHapticsAsync(isPlaying ? Haptics.AndroidHaptics.Toggle_On : Haptics.AndroidHaptics.Toggle_Off)
            : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        feedback.catch(() => { });
    }

    function togglePlay() {
        if (status.playing) {
            player.pause();
            triggerPlaybackHaptic(false);
        } else if (activeTrack) {
            player.play();
            triggerPlaybackHaptic(true);
        } else if (tracks[0]) {
            playTrack(tracks[0]);
            triggerPlaybackHaptic(true);
        }
    }

    function playNext(direction = 1) {
        const source = queue.length ? queue : tracks;
        if (!source.length) return null;
        const currentIndex = source.findIndex((track) => track.id === activeTrack?.id);
        let nextIndex;
        if (direction > 0 && advancedSettings.shuffleEnabled && source.length > 1) {
            const candidates = source.map((_, index) => index).filter((index) => index !== currentIndex);
            nextIndex = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
            nextIndex = currentIndex < 0 ? (direction > 0 ? 0 : source.length - 1) : currentIndex + direction;
        }
        if (nextIndex < 0 || nextIndex >= source.length) {
            if (!advancedSettings.repeatAllEnabled) return null;
            nextIndex = (nextIndex + source.length) % source.length;
        }
        const nextTrack = source[nextIndex];
        playTrack(nextTrack, source);
        return nextTrack;
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

    function updateVolume(nextVolume) {
        const next = Math.max(0, Math.min(advancedSettings.volumeLimit, nextVolume));
        player.volume = next;
        setVolume(next);
    }

    function updateAdvancedSetting(key, value) {
        setAdvancedSettings((current) => ({ ...current, [key]: value }));
    }

    function onVolumePress(event) {
        updateVolume(event.nativeEvent.locationX / volumeBarWidth);
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
                        stylesOverride={styles}
                        accentColor={C.green}
                        secondaryColor={C.secondary}
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
                        stylesOverride={styles}
                        accentColor={C.green}
                    />
                )}
            />
        );
    }

    function renderTracks() {
        if (loading && tracks.length === 0) {
            return <EmptyState icon="radio-outline" title="Finding your music" detail="Scanning audio stored on this device." busy stylesOverride={styles} accentColor={C.green} />;
        }
        if (permissionGranted === false && tracks.length === 0) {
            return <EmptyState icon="lock-closed-outline" title="Music access is off" detail="Allow audio access to scan the device library, or import individual songs from Files." action="Request access" onAction={scanLibrary} secondaryAction="Import from Files" onSecondaryAction={importMusicFiles} stylesOverride={styles} accentColor={C.green} />;
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
                        <Artwork size={62} tint={index % 2 ? '#D2A7FF' : C.green} />
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
                    <EmptyState icon="albums-outline" title="No albums yet" detail="Scan your device music library to find albums." action="Scan device" onAction={scanLibrary} busy={loading} stylesOverride={styles} accentColor={C.green} />
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
        const themeOptions = ['Light', 'Dark'];
        const accentOptions = ACCENT_COLORS;
        const frequencies = [31, 62, 125, 250, 500, 1, 2, 4, 8, 16];
        const presetMap = {
            Custom: [0.66, 0.76, 0.82, 0.58, 0.72, 0.64, 0.75, 0.6, 0.86, 0.7],
            Flat: [0.5, 0.52, 0.54, 0.56, 0.58, 0.6, 0.6, 0.58, 0.54, 0.5],
            Acoustic: [0.7, 0.78, 0.72, 0.68, 0.7, 0.66, 0.6, 0.56, 0.58, 0.62],
            Classical: [0.68, 0.7, 0.74, 0.82, 0.76, 0.7, 0.64, 0.6, 0.56, 0.52],
        };

        const updateEqLevel = (index, value) => {
            const clamped = Math.max(0, Math.min(1, value));
            setSelectedPreset('Custom');
            setEqLevels((current) => current.map((level, levelIndex) => (levelIndex === index ? clamped : level)));
        };

        const handleEqPress = (index, event) => {
            const targetHeight = 170;
            const offset = Math.max(0, Math.min(targetHeight, event.nativeEvent.locationY));
            const ratio = 1 - offset / targetHeight;
            updateEqLevel(index, ratio);
        };

        const applyPreset = (preset) => {
            const next = presetMap[preset];
            if (next) {
                setSelectedPreset(preset);
                setEqLevels(next);
            }
        };

        const applyReverb = (reverb) => {
            setSelectedReverb(reverb);
        };

        const updateSliderValue = (setter, width, xPosition) => {
            const safeWidth = Math.max(1, width || 1);
            const ratio = Math.max(0, Math.min(1, xPosition / safeWidth));
            setter((ratio * 2) - 1);
        };

        const getSliderDisplay = (value) => ((value + 1) / 2) * 100;

        if (settingsView === 'advanced') {
            return (
                <AdvancedSettingsScreen
                    accent={accent}
                    autoPlayNext={advancedSettings.autoPlayNext}
                    onToggleAutoPlayNext={() => updateAdvancedSetting('autoPlayNext', !advancedSettings.autoPlayNext)}
                    pitchCorrection={advancedSettings.pitchCorrection}
                    onTogglePitchCorrection={() => updateAdvancedSetting('pitchCorrection', !advancedSettings.pitchCorrection)}
                    hapticsEnabled={advancedSettings.hapticsEnabled}
                    onToggleHaptics={() => updateAdvancedSetting('hapticsEnabled', !advancedSettings.hapticsEnabled)}
                    playbackRate={advancedSettings.playbackRate}
                    onSetPlaybackRate={(rate) => updateAdvancedSetting('playbackRate', rate)}
                    volumeLimit={advancedSettings.volumeLimit}
                    onSetVolumeLimit={(limit) => updateAdvancedSetting('volumeLimit', Math.max(0.3, Math.min(1, limit)))}
                    onReset={() => setAdvancedSettings(DEFAULT_PLAYBACK_SETTINGS)}
                    onBack={() => setSettingsView('main')}
                    isLightTheme={isLightTheme}
                />
            );
        }

        if (settingsView === 'equalizer') {
            return (
                <ScrollView contentContainerStyle={styles.equalizerPage} showsVerticalScrollIndicator={false}>
                    <View style={styles.settingsHeader}>
                        <Pressable style={styles.headerBackButton} onPress={() => setSettingsView('main')}>
                            <Ionicons name="arrow-back" size={22} color={C.text} />
                        </Pressable>
                        <Text style={styles.settingsHeaderTitle}>Equalizer</Text>
                        <View style={styles.headerActionBadge}>
                            <ToggleSwitch enabled={equalizerEnabled} onToggle={() => setEqualizerEnabled((value) => !value)} activeColor={C.green} />
                        </View>
                    </View>

                    <View style={styles.eqVisualWrap}>
                        <View style={styles.eqBars}>
                            {eqLevels.map((ratio, index) => (
                                <Pressable
                                    key={frequencies[index]}
                                    style={styles.eqBarColumn}
                                    onPress={(event) => handleEqPress(index, event)}
                                >
                                    <Text style={styles.eqValue}>{ratio.toFixed(1)}</Text>
                                    <View style={[styles.eqBarTrack, { height: 170 }]}>
                                        <View style={[styles.eqBarFill, { height: `${ratio * 100}%` }]} />
                                    </View>
                                    <Text style={styles.eqFreq}>{frequencies[index]}{index >= 5 ? 'K' : ''}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.presetSection}>
                        <View style={styles.presetRowHeader}>
                            <Text style={styles.presetTitle}>Presets</Text>
                            <Pressable style={styles.savePresetButton}>
                                <Text style={styles.savePresetText}>Save preset</Text>
                            </Pressable>
                        </View>
                        <View style={styles.presetGrid}>
                            {['Custom', 'Flat', 'Acoustic', 'Classical'].map((preset) => (
                                <Pressable
                                    key={preset}
                                    style={[styles.presetChip, selectedPreset === preset && styles.presetChipActive]}
                                    onPress={() => applyPreset(preset)}
                                >
                                    <Text style={[styles.presetText, selectedPreset === preset && styles.presetTextActive]}>{preset}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.presetSection}>
                        <Text style={styles.presetTitle}>Reverb</Text>
                        <View style={styles.presetGrid}>
                            {['Off', 'Room', 'Cathedral', 'Chamber'].map((preset) => (
                                <Pressable
                                    key={preset}
                                    style={[styles.presetChip, selectedReverb === preset && styles.presetChipActive]}
                                    onPress={() => applyReverb(preset)}
                                >
                                    <Text style={[styles.presetText, selectedReverb === preset && styles.presetTextActive]}>{preset}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.sliderBlock}>
                        <View style={styles.sliderHeaderRow}>
                            <Text style={styles.presetTitle}>Preamp</Text>
                            <Text style={styles.sliderValue}>{preamp.toFixed(1)} dB</Text>
                        </View>
                        <Pressable
                            onLayout={(event) => setPreampWidth(event.nativeEvent.layout.width)}
                            onPress={(event) => updateSliderValue(setPreamp, preampWidth, event.nativeEvent.locationX)}
                            style={styles.sliderTrack}
                        >
                            <View style={[styles.sliderFill, { width: `${getSliderDisplay(preamp)}%` }]} />
                            <View style={[styles.sliderThumb, { left: `${getSliderDisplay(preamp)}%` }]} />
                        </Pressable>
                    </View>

                    <View style={styles.sliderBlock}>
                        <View style={styles.sliderHeaderRow}>
                            <Text style={styles.presetTitle}>Bass Boost</Text>
                            <Text style={styles.sliderValue}>{bassBoost.toFixed(1)} dB</Text>
                        </View>
                        <Pressable
                            onLayout={(event) => setBassBoostWidth(event.nativeEvent.layout.width)}
                            onPress={(event) => updateSliderValue(setBassBoost, bassBoostWidth, event.nativeEvent.locationX)}
                            style={styles.sliderTrack}
                        >
                            <View style={[styles.sliderFill, { width: `${getSliderDisplay(bassBoost)}%` }]} />
                            <View style={[styles.sliderThumb, { left: `${getSliderDisplay(bassBoost)}%` }]} />
                        </Pressable>
                    </View>
                </ScrollView>
            );
        }

        return (
            <ScrollView contentContainerStyle={styles.settingsPage} showsVerticalScrollIndicator={false}>
                <View style={styles.settingsHeader}>
                    <Text style={styles.settingsHeaderTitle}>Settings</Text>
                    <Pressable style={styles.headerActionBadge} accessibilityRole="button" accessibilityLabel="Quick actions">
                        <Ionicons name="sparkles-outline" size={18} color={C.green} />
                    </Pressable>
                </View>

                <View style={styles.settingsSection}>
                    <Text style={styles.sectionCaption}>Playback</Text>
                    <Pressable style={styles.settingRow} onPress={() => setSettingsView('equalizer')}>
                        <View style={styles.settingRowIcon}><Ionicons name="options-outline" size={20} color={C.green} /></View>
                        <View style={styles.settingRowText}>
                            <Text style={styles.settingRowTitle}>Equalizer</Text>
                            <Text style={styles.settingRowDescription}>{equalizerEnabled ? 'Custom tune enabled' : 'Disabled'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={C.secondary} />
                    </Pressable>

                    <Pressable style={styles.settingRow} onPress={() => setSettingsView('advanced')}>
                        <View style={styles.settingRowIcon}><Ionicons name="construct-outline" size={20} color={C.green} /></View>
                        <View style={styles.settingRowText}>
                            <Text style={styles.settingRowTitle}>Advanced settings</Text>
                            <Text style={styles.settingRowDescription}>Fine controls for playback</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={C.secondary} />
                    </Pressable>

                    <Pressable style={styles.settingRow} onPress={() => setAudioFocusEnabled((value) => !value)}>
                        <View style={styles.settingRowIcon}><Ionicons name="volume-medium-outline" size={20} color={C.green} /></View>
                        <View style={styles.settingRowText}>
                            <Text style={styles.settingRowTitle}>Audio focus</Text>
                            <Text style={styles.settingRowDescription}>{audioFocusEnabled ? 'Adaptive volume on' : 'Adaptive volume off'}</Text>
                        </View>
                        <ToggleSwitch enabled={audioFocusEnabled} onToggle={() => setAudioFocusEnabled((value) => !value)} activeColor={C.green} />
                    </Pressable>
                </View>

                <View style={styles.settingsSection}>
                    <Text style={styles.sectionCaption}>Appearance</Text>
                    <View style={styles.segmentedRow}>
                        {themeOptions.map((option) => (
                            <Pressable
                                key={option}
                                style={[styles.segmentButton, themeMode === option && styles.segmentButtonActive]}
                                onPress={() => setThemeMode(option)}
                            >
                                <Text style={[styles.segmentText, themeMode === option && styles.segmentTextActive]}>{option}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.inlineLabel}>Accent color</Text>
                    <View style={styles.accentRow}>
                        {accentOptions.map((color) => (
                            <Pressable
                                key={color}
                                accessibilityRole="radio"
                                accessibilityLabel={`Accent color ${color}`}
                                accessibilityState={{ checked: accent === color }}
                                onPress={() => setAccent(color)}
                                style={[styles.accentSwatch, { backgroundColor: color }, accent === color && styles.accentSelected]}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.settingsSection}>
                    <Text style={styles.sectionCaption}>Library</Text>
                    <View style={styles.settingCard}>
                        <View style={styles.settingIcon}><Ionicons name="musical-notes-outline" size={18} color={accent} /></View>
                        <View style={styles.flexOne}>
                            <Text style={styles.cardTitle}>Device library</Text>
                            <Text style={styles.cardSub}>{permissionGranted ? `${tracks.length} tracks available` : 'Access media files on this device'}</Text>
                        </View>
                        <Pressable onPress={scanLibrary} style={styles.smallAction}>
                            <Text style={styles.smallActionText}>{loading ? 'Scanning' : 'Rescan'}</Text>
                        </Pressable>
                    </View>

                    <Pressable style={styles.settingRow} onPress={() => setLibraryAutoScan((value) => !value)}>
                        <View style={styles.settingRowIcon}><Ionicons name="scan-outline" size={20} color={C.green} /></View>
                        <View style={styles.settingRowText}>
                            <Text style={styles.settingRowTitle}>Auto scan</Text>
                            <Text style={styles.settingRowDescription}>{libraryAutoScan ? 'On' : 'Off'}</Text>
                        </View>
                        <ToggleSwitch enabled={libraryAutoScan} onToggle={() => setLibraryAutoScan((value) => !value)} activeColor={C.green} />
                    </Pressable>

                    <Pressable style={styles.settingRow} onPress={() => setSmartImportEnabled((value) => !value)}>
                        <View style={styles.settingRowIcon}><Ionicons name="folder-open-outline" size={20} color={C.green} /></View>
                        <View style={styles.settingRowText}>
                            <Text style={styles.settingRowTitle}>Smart import</Text>
                            <Text style={styles.settingRowDescription}>{smartImportEnabled ? 'Organize automatically' : 'Ask before importing'}</Text>
                        </View>
                        <ToggleSwitch enabled={smartImportEnabled} onToggle={() => setSmartImportEnabled((value) => !value)} activeColor={C.green} />
                    </Pressable>

                    <Pressable style={styles.settingRow} onPress={importMusicFiles}>
                        <View style={styles.settingRowIcon}><Ionicons name="add-circle-outline" size={20} color={C.green} /></View>
                        <View style={styles.settingRowText}>
                            <Text style={styles.settingRowTitle}>Import music</Text>
                            <Text style={styles.settingRowDescription}>Files and local audio</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={C.secondary} />
                    </Pressable>
                </View>

                {permissionGranted === false ? (
                    <Text style={styles.helperText}>Audio access was declined. Enable media access in iPhone Settings to scan your library.</Text>
                ) : null}
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
                    <View style={styles.seekBackground} />
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
                <View style={styles.waveformBand}>
                    <WaveformVisualizer playing={status.playing} accent={accent} />
                </View>
                <View style={styles.nowFooter}>
                    <Pressable onPress={() => setShowQueue(true)} style={styles.footerControl} accessibilityRole="button" accessibilityLabel="Show playback queue">
                        <Ionicons name="list-outline" size={19} color={C.secondary} />
                    </Pressable>
                    <Pressable
                        onPress={() => updateAdvancedSetting('shuffleEnabled', !advancedSettings.shuffleEnabled)}
                        style={styles.repeatControl}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: advancedSettings.shuffleEnabled }}
                        accessibilityLabel={advancedSettings.shuffleEnabled ? 'Turn shuffle off' : 'Turn shuffle on'}
                    >
                        <Ionicons name={advancedSettings.shuffleEnabled ? 'shuffle' : 'shuffle-outline'} size={21} color={advancedSettings.shuffleEnabled ? accent : C.secondary} />
                        <Text style={[styles.repeatModeText, { color: advancedSettings.shuffleEnabled ? accent : C.dim }]}>{advancedSettings.shuffleEnabled ? 'ON' : 'OFF'}</Text>
                    </Pressable>
                    <Pressable onPress={() => setShowQueue(true)} style={styles.queueCountControl} accessibilityRole="button" accessibilityLabel="Show playback queue">
                        <Text numberOfLines={1} style={styles.nowFooterText}>{queue.length || tracks.length} tracks in queue</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => updateAdvancedSetting('repeatAllEnabled', !advancedSettings.repeatAllEnabled)}
                        style={styles.repeatControl}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: advancedSettings.repeatAllEnabled }}
                        accessibilityLabel={`Repeat all ${advancedSettings.repeatAllEnabled ? 'on' : 'off'}`}
                    >
                        <Ionicons name={advancedSettings.repeatAllEnabled ? 'repeat' : 'repeat-outline'} size={21} color={advancedSettings.repeatAllEnabled ? accent : C.secondary} />
                        <Text style={[styles.repeatModeText, { color: advancedSettings.repeatAllEnabled ? accent : C.dim }]}>{advancedSettings.repeatAllEnabled ? 'ALL' : 'OFF'}</Text>
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
                                    accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                                    onAccessibilityAction={(event) => updateVolume(volume + (event.nativeEvent.actionName === 'increment' ? 0.05 : -0.05))}
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

    if (showNowPlaying && activeTrack) return renderNowPlaying();

    return (
        <View style={styles.screen}>
            <View style={styles.topBar}>
                <View style={styles.brandDot}><Ionicons name="pulse" size={18} color={C.background} /></View>
                <View style={styles.flexOne}><Text style={styles.brandName}>WAVE</Text><Text style={styles.brandCaption}>YOUR MUSIC, YOUR CURRENT</Text></View>
                <IconButton name="person-circle-outline" color={C.secondary} onPress={() => { setActiveTab('Settings'); setSettingsView('main'); }} accessibilityLabel="Open settings" />
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
                        <Pressable key={tab.key} style={styles.tab} onPress={() => { setActiveTab(tab.key); setSelectedPlaylist(null); setSettingsView('main'); }} accessibilityRole="tab" accessibilityState={{ selected: active }}>
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
    settingsPage: { paddingHorizontal: 18, paddingBottom: 28 },
    equalizerPage: { paddingHorizontal: 18, paddingBottom: 28 },
    settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 16 },
    settingsHeaderTitle: { color: C.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
    headerBackButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A221F', borderWidth: 1, borderColor: '#243228', alignItems: 'center', justifyContent: 'center' },
    headerActionBadge: { width: 52, height: 38, borderRadius: 16, backgroundColor: '#1A221F', borderWidth: 1, borderColor: '#243228', alignItems: 'center', justifyContent: 'center' },
    settingsSection: { backgroundColor: '#141914', borderRadius: 22, borderWidth: 1, borderColor: '#232B27', paddingVertical: 8, paddingHorizontal: 10, marginBottom: 18 },
    sectionCaption: { color: '#93A19B', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 10, paddingTop: 12, paddingBottom: 8 },
    settingRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14 },
    settingRowIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#171E1B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27312D' },
    settingRowText: { flex: 1, minWidth: 0 },
    settingRowTitle: { color: C.text, fontSize: 17, fontWeight: '600' },
    settingRowDescription: { color: C.secondary, fontSize: 12, marginTop: 3 },
    togglePill: { width: 52, height: 30, borderRadius: 15, backgroundColor: '#434B47', justifyContent: 'center', paddingHorizontal: 4 },
    togglePillActive: { backgroundColor: C.green },
    toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F4F6F4', alignSelf: 'flex-start' },
    toggleKnobActive: { alignSelf: 'flex-end' },
    segmentedRow: { flexDirection: 'row', backgroundColor: '#1C241F', borderRadius: 14, padding: 4, marginHorizontal: 4, marginBottom: 10 },
    segmentButton: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    segmentButtonActive: { backgroundColor: C.green },
    segmentText: { fontSize: 12, fontWeight: '700', color: '#D7DDD9', letterSpacing: 0.7 },
    segmentTextActive: { color: '#0B120F' },
    inlineLabel: { color: '#A9B3AE', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8 },
    accentRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingBottom: 12 },
    accentSwatch: { width: 30, height: 30, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
    accentSelected: { borderColor: '#F3F5F2', transform: [{ scale: 1.08 }] },
    eqVisualWrap: { marginTop: 8, marginBottom: 12, paddingTop: 12, paddingBottom: 10, borderRadius: 18, backgroundColor: '#0F1412' },
    eqBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10, minHeight: 210 },
    eqBarColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 },
    eqValue: { color: '#A3B0AB', fontSize: 10, marginBottom: 6 },
    eqBarTrack: { width: 12, borderRadius: 6, backgroundColor: '#2E3936', justifyContent: 'flex-end', overflow: 'hidden' },
    eqBarFill: { width: '100%', borderRadius: 6, backgroundColor: C.green },
    eqFreq: { color: '#A3B0AB', fontSize: 11, marginTop: 8 },
    presetSection: { marginTop: 14, marginBottom: 4 },
    presetRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    presetTitle: { color: C.text, fontSize: 20, fontWeight: '700' },
    savePresetButton: { minHeight: 34, borderRadius: 12, backgroundColor: '#1D2A24', paddingHorizontal: 14, justifyContent: 'center' },
    savePresetText: { color: C.green, fontSize: 12, fontWeight: '700' },
    presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    presetChip: { flexBasis: '48%', minHeight: 42, borderRadius: 12, backgroundColor: '#1D2421', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A312E' },
    presetChipActive: { backgroundColor: C.green },
    presetText: { color: '#EAEDEB', fontSize: 15, fontWeight: '600' },
    presetTextActive: { color: '#09110F' },
    sliderBlock: { marginTop: 18 },
    sliderHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    sliderValue: { color: '#D9E0DD', fontSize: 16, fontWeight: '600' },
    sliderTrack: { height: 12, borderRadius: 10, backgroundColor: '#2E3936', position: 'relative', justifyContent: 'center', overflow: 'hidden' },
    sliderFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.green, borderRadius: 10 },
    sliderThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F2F5F3', position: 'absolute', top: -5, transform: [{ translateX: -11 }], borderWidth: 1, borderColor: '#A7B6B0' },
    settingCard: { minHeight: 72, paddingHorizontal: 12, marginHorizontal: 4, borderRadius: 16, backgroundColor: '#1A201D', borderWidth: 1, borderColor: '#2A302E', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    settingIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#18251C', alignItems: 'center', justifyContent: 'center' },
    smallAction: { minHeight: 34, paddingHorizontal: 12, borderRadius: 11, backgroundColor: '#1E372A', justifyContent: 'center' },
    smallActionText: { color: C.green, fontSize: 12, fontWeight: '700' },
    addButton: { backgroundColor: C.green, width: 40, height: 40, borderRadius: 20 },
    favoritePlaylist: { minHeight: 83, padding: 12, borderRadius: 17, backgroundColor: '#18211C', flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 10 },
    favoriteArt: { width: 58, height: 58, borderRadius: 13, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
    playlistRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: 1, borderBottomColor: C.border },
    cardTitle: { color: C.text, fontSize: 15, fontWeight: '600' },
    cardSub: { color: C.secondary, fontSize: 11, marginTop: 5 },
    helperText: { color: C.dim, fontSize: 12, lineHeight: 19, paddingTop: 8, paddingHorizontal: 10 },
    detailHeader: { paddingHorizontal: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
    sectionTitle: { color: C.text, fontSize: 22, fontWeight: '700' },
    albumGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingTop: 4 },
    albumCard: { width: '48%', marginBottom: 22 },
    albumTitle: { color: C.text, fontSize: 13, fontWeight: '600', marginTop: 10 },
    settingLabel: { color: C.dim, fontSize: 10, fontWeight: '700', letterSpacing: 1.35, marginTop: 18, marginBottom: 10 },
    accentRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 13, paddingVertical: 4 },
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
    seekTrack: { height: 26, justifyContent: 'center', marginTop: 11, position: 'relative' },
    seekBackground: { position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 2, backgroundColor: '#3A443E' },
    seekProgress: { height: 3, borderRadius: 2, backgroundColor: C.green },
    seekThumb: { position: 'absolute', width: 12, height: 12, borderRadius: 6, marginLeft: -6 },
    timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 },
    timeLabel: { color: C.dim, fontSize: 10 },
    playbackError: { color: C.danger, fontSize: 11, textAlign: 'center', marginTop: 8 },
    transport: { height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
    playButton: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
    waveformBand: { height: 28, alignItems: 'center', justifyContent: 'center' },
    nowFooter: { height: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footerControl: { minWidth: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
    repeatControl: { minWidth: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
    repeatModeText: { fontSize: 7, fontWeight: '800', lineHeight: 9 },
    queueCountControl: { flex: 1, minWidth: 0, alignItems: 'center' },
    nowFooterText: { color: C.secondary, fontSize: 11 },
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

function createAppearanceStyles(palette, isLightTheme) {
    const overrides = {
        brandDot: { backgroundColor: palette.green },
        importButtonText: { color: palette.green },
        shuffleButton: { backgroundColor: palette.green },
        primaryButton: { backgroundColor: palette.green },
        secondaryButtonText: { color: palette.green },
        togglePillActive: { backgroundColor: palette.green },
        segmentButtonActive: { backgroundColor: palette.green },
        eqBarFill: { backgroundColor: palette.green },
        savePresetText: { color: palette.green },
        presetChipActive: { backgroundColor: palette.green },
        presetTextActive: { color: palette.text },
        segmentTextActive: { color: palette.text },
        sliderFill: { backgroundColor: palette.green },
        addButton: { backgroundColor: palette.green },
        favoriteArt: { backgroundColor: palette.green },
        smallActionText: { color: palette.green },
        modalEyebrow: { color: palette.green },
    };

    if (isLightTheme) {
        Object.assign(overrides, {
            screen: { backgroundColor: palette.background },
            topBar: { borderBottomColor: palette.border },
            brandName: { color: palette.text },
            brandCaption: { color: palette.dim },
            searchToggle: { backgroundColor: palette.surface, borderColor: palette.border },
            searchField: { backgroundColor: palette.surface },
            searchInput: { color: palette.text },
            trackRow: { borderBottomColor: palette.border },
            trackTitle: { color: palette.text },
            trackSubtitle: { color: palette.secondary },
            trackDuration: { color: palette.dim },
            emptyIcon: { backgroundColor: palette.surfaceRaised },
            emptyTitle: { color: palette.text },
            emptyDetail: { color: palette.secondary },
            secondaryButton: { borderColor: palette.border },
            eyebrow: { color: palette.dim },
            heroTitle: { color: palette.text },
            trackCount: { color: palette.secondary },
            favoritePlaylist: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
            playlistRow: { borderBottomColor: palette.border },
            cardTitle: { color: palette.text },
            cardSub: { color: palette.secondary },
            albumTitle: { color: palette.text },
            settingsHeaderTitle: { color: palette.text },
            headerBackButton: { backgroundColor: palette.surfaceRaised, borderColor: palette.border },
            headerActionBadge: { backgroundColor: palette.surfaceRaised, borderColor: palette.border },
            settingsSection: { backgroundColor: palette.surface, borderColor: palette.border },
            sectionCaption: { color: palette.secondary },
            settingRowIcon: { backgroundColor: palette.surfaceRaised, borderColor: palette.border },
            settingRowTitle: { color: palette.text },
            settingRowDescription: { color: palette.secondary },
            segmentedRow: { backgroundColor: palette.surfaceRaised },
            segmentText: { color: palette.text },
            segmentTextActive: { color: palette.text },
            inlineLabel: { color: palette.secondary },
            accentSelected: { borderColor: palette.text },
            settingCard: { backgroundColor: palette.surface, borderColor: palette.border },
            settingIcon: { backgroundColor: palette.surfaceRaised },
            smallAction: { backgroundColor: palette.surfaceRaised },
            eqVisualWrap: { backgroundColor: palette.surface },
            eqValue: { color: palette.secondary },
            eqBarTrack: { backgroundColor: palette.surfaceRaised },
            eqFreq: { color: palette.secondary },
            presetTitle: { color: palette.text },
            savePresetButton: { backgroundColor: palette.surfaceRaised },
            presetChip: { backgroundColor: palette.surface, borderColor: palette.border },
            presetText: { color: palette.text },
            sliderValue: { color: palette.text },
            sliderTrack: { backgroundColor: palette.surfaceRaised },
            sliderThumb: { backgroundColor: palette.surface, borderColor: palette.secondary },
            miniPlayer: { backgroundColor: palette.surface, borderColor: palette.border },
            miniTitle: { color: palette.text },
            miniSubtitle: { color: palette.secondary },
            tabBar: { backgroundColor: palette.surface, borderTopColor: palette.border },
            tabText: { color: palette.dim },
            nowPlaying: { backgroundColor: palette.background },
            headerIcon: { backgroundColor: palette.surface, borderColor: palette.border },
            nowEyebrow: { color: palette.text },
            nowContext: { color: palette.dim },
            artworkIndexText: { color: palette.secondary },
            nowTitle: { color: palette.text },
            seekBackground: { backgroundColor: palette.border },
            timeLabel: { color: palette.dim },
            nowFooter: { borderTopColor: palette.border },
            nowFooterText: { color: palette.secondary },
            utilityModal: { backgroundColor: palette.surface, borderColor: palette.border },
            utilityTitle: { color: palette.text },
            queueItem: { borderTopColor: palette.border },
            queueTrackTitle: { color: palette.text },
            queueTrackArtist: { color: palette.secondary },
            queueEmpty: { color: palette.secondary },
            volumeStep: { backgroundColor: palette.surfaceRaised },
            volumeBarBackground: { backgroundColor: palette.border },
            volumeValue: { color: palette.secondary },
            createModal: { backgroundColor: palette.surface, borderColor: palette.border },
            trackOptionsModal: { backgroundColor: palette.surface, borderColor: palette.border },
            trackOptionsTitle: { color: palette.text },
            trackOptionsSubtitle: { color: palette.secondary },
            trackOption: { borderTopColor: palette.border },
            trackOptionText: { color: palette.text },
            trackOptionsCancel: { backgroundColor: palette.surfaceRaised },
            trackOptionsCancelText: { color: palette.text },
            modalTitle: { color: palette.text },
            playlistInput: { color: palette.text, backgroundColor: palette.surfaceRaised, borderColor: palette.border },
            cancelText: { color: palette.secondary },
        });
    }

    const themedStyles = { ...styles };
    Object.entries(overrides).forEach(([key, override]) => {
        themedStyles[key] = [styles[key], override];
    });
    return themedStyles;
}
