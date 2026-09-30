import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const MusicFiles = (() => {
    try {
        return require('react-native-get-music-files');
    } catch {
        return null;
    }
})();

const PLAYLISTS_KEY = '@wave-music/playlists-v1';
const FAVORITES_KEY = '@wave-music/favorites-v1';
const IMPORTED_TRACKS_KEY = '@wave-music/imported-tracks-v1';

function titleFromFilename(filename) {
    return filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function isSameImportedFile(first, second) {
    const firstName = (first.filename || '').trim().toLocaleLowerCase();
    const secondName = (second.filename || '').trim().toLocaleLowerCase();
    if (!firstName || firstName !== secondName) return false;
    // Older saved imports have no size metadata, so treat a matching name as a duplicate.
    return !first.size || !second.size || first.size === second.size;
}

async function albumNameForAsset(asset) {
    try {
        const [album] = await asset.getAlbums();
        return album ? await album.getTitle() : 'Singles';
    } catch {
        return 'Singles';
    }
}

function filenameKey(value) {
    const filename = String(value || '').split(/[\\/]/).pop() || '';
    try {
        return decodeURIComponent(filename).trim().toLocaleLowerCase();
    } catch {
        return filename.trim().toLocaleLowerCase();
    }
}

function normalizeArtworkUri(value) {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:') || trimmed.startsWith('file:') || trimmed.startsWith('content:') || /^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return `data:image/jpeg;base64,${trimmed}`;
}

function artworkKeysForMusicFile(musicFile) {
    const candidates = [
        musicFile?.url,
        musicFile?.path,
        musicFile?.filePath,
        musicFile?.filename,
        musicFile?.title,
        musicFile?.name,
    ]
        .filter(Boolean)
        .map((value) => filenameKey(value));

    if (musicFile?.title && musicFile?.artist) {
        candidates.push(filenameKey(`${musicFile.artist}-${musicFile.title}`));
    }

    return [...new Set(candidates.filter(Boolean))];
}

async function loadDeviceArtwork() {
    const artworkByFilename = new Map();
    if (!MusicFiles?.getAll) return artworkByFilename;

    try {
        const musicFiles = await MusicFiles.getAll({ limit: 2000, offset: 0, coverQuality: 30, minSongDuration: 0 });
        if (!Array.isArray(musicFiles)) return artworkByFilename;

        musicFiles.forEach((musicFile) => {
            const artworkUri = normalizeArtworkUri(musicFile?.cover || musicFile?.thumbnail || musicFile?.artwork);
            if (!artworkUri) return;
            artworkKeysForMusicFile(musicFile).forEach((key) => {
                artworkByFilename.set(key, artworkUri);
            });
        });
    } catch {
        return artworkByFilename;
    }

    return artworkByFilename;
}

export async function scanDeviceMusic() {
    const importedTracks = await loadImportedTracks();
    const permission = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
    if (!permission.granted) {
        return { permissionGranted: false, tracks: importedTracks };
    }

    const assets = await new MediaLibrary.Query()
        .eq(MediaLibrary.AssetField.MEDIA_TYPE, MediaLibrary.MediaType.AUDIO)
        .orderBy(MediaLibrary.AssetField.CREATION_TIME)
        .limit(2000)
        .exe();

    const tracks = [];
    for (let offset = 0; offset < assets.length; offset += 40) {
        const batch = await Promise.all(assets.slice(offset, offset + 40).map(async (asset) => {
            try {
                const [info, album] = await Promise.all([asset.getInfo(), albumNameForAsset(asset)]);
                return {
                    id: info.id,
                    uri: info.uri,
                    filename: info.filename,
                    title: titleFromFilename(info.filename),
                    artist: 'Unknown artist',
                    album,
                    duration: Math.max(0, Math.round((info.duration || 0) / 1000)),
                    creationTime: info.creationTime || 0,
                    source: 'device',
                };
            } catch {
                return null;
            }
        }));
        tracks.push(...batch.filter(Boolean));
    }

    const artworkByFilename = await loadDeviceArtwork();
    const tracksWithArtwork = tracks.map((track) => {
        const directKey = filenameKey(track.filename);
        const fallbackKey = filenameKey(track.title);
        const artworkUri = artworkByFilename.get(directKey)
            || artworkByFilename.get(fallbackKey)
            || null;

        return {
            ...track,
            artworkUri,
        };
    });

    return {
        permissionGranted: true,
        tracks: [...tracksWithArtwork, ...importedTracks].sort((a, b) => a.title.localeCompare(b.title)),
    };
}

export async function loadImportedTracks() {
    try {
        return JSON.parse((await AsyncStorage.getItem(IMPORTED_TRACKS_KEY)) || '[]');
    } catch {
        return [];
    }
}

export async function importAudioFiles() {
    const selection = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: true,
    });
    if (selection.canceled) return { additions: [], skipped: 0, canceled: true };

    const directory = new Directory(Paths.document, 'WaveMusicImports');
    if (!directory.exists) directory.create({ intermediates: true, idempotent: true });

    const importedTracks = await loadImportedTracks();
    const additions = [];
    let skipped = 0;
    const seen = [...importedTracks];
    for (const [index, asset] of selection.assets.entries()) {
        const candidate = { filename: asset.name, size: asset.size || 0 };
        if (seen.some((track) => isSameImportedFile(track, candidate))) {
            skipped += 1;
            continue;
        }
        const filename = asset.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
        const destination = new File(directory, `${Date.now()}-${index}-${filename}`);
        await new File(asset.uri).copy(destination);
        const track = {
            id: `import:${destination.uri}`,
            uri: destination.uri,
            filename: asset.name,
            size: asset.size || 0,
            title: titleFromFilename(asset.name),
            artist: 'Unknown artist',
            album: 'Imported audio',
            duration: 0,
            creationTime: asset.lastModified || Date.now(),
            source: 'files',
        };
        additions.push(track);
        seen.push(track);
    }

    const merged = [...importedTracks, ...additions];
    await AsyncStorage.setItem(IMPORTED_TRACKS_KEY, JSON.stringify(merged));
    return { additions, skipped, canceled: false };
}

export async function removeImportedTrack(trackId) {
    const importedTracks = await loadImportedTracks();
    const nextTracks = importedTracks.filter((track) => track.id !== trackId);
    await AsyncStorage.setItem(IMPORTED_TRACKS_KEY, JSON.stringify(nextTracks));
    return nextTracks;
}

export async function loadPlaylists() {
    try {
        return JSON.parse((await AsyncStorage.getItem(PLAYLISTS_KEY)) || '[]');
    } catch {
        return [];
    }
}

export async function savePlaylists(playlists) {
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

export async function loadFavorites() {
    try {
        return JSON.parse((await AsyncStorage.getItem(FAVORITES_KEY)) || '[]');
    } catch {
        return [];
    }
}

export async function saveFavorites(favorites) {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function formatDuration(seconds) {
    const minutes = Math.floor((seconds || 0) / 60);
    const remainder = Math.floor(seconds || 0) % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
}
