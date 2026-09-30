import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

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

async function albumNameForAsset(asset) {
    try {
        const [album] = await asset.getAlbums();
        return album ? await album.getTitle() : 'Singles';
    } catch {
        return 'Singles';
    }
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

    return {
        permissionGranted: true,
        tracks: [...tracks, ...importedTracks].sort((a, b) => a.title.localeCompare(b.title)),
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
    if (selection.canceled) return [];

    const directory = new Directory(Paths.document, 'WaveMusicImports');
    if (!directory.exists) directory.create({ intermediates: true, idempotent: true });

    const importedTracks = await loadImportedTracks();
    const additions = [];
    for (const [index, asset] of selection.assets.entries()) {
        const filename = asset.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
        const destination = new File(directory, `${Date.now()}-${index}-${filename}`);
        await new File(asset.uri).copy(destination);
        additions.push({
            id: `import:${destination.uri}`,
            uri: destination.uri,
            filename: asset.name,
            title: titleFromFilename(asset.name),
            artist: 'Unknown artist',
            album: 'Imported audio',
            duration: 0,
            creationTime: asset.lastModified || Date.now(),
            source: 'files',
        });
    }

    const merged = [...importedTracks, ...additions];
    await AsyncStorage.setItem(IMPORTED_TRACKS_KEY, JSON.stringify(merged));
    return additions;
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