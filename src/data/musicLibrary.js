import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { parseBuffer } from 'music-metadata';

const PLAYLISTS_KEY = '@wave-music/playlists-v1';
const FAVORITES_KEY = '@wave-music/favorites-v1';
const IMPORTED_TRACKS_KEY = '@wave-music/imported-tracks-v1';
const ARTWORK_EXTRACTION_VERSION = 7;

function titleFromFilename(filename) {
    const safeName = typeof filename === 'string' ? filename : '';
    return safeName
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || 'Untitled track';
}

function toComparableFilename(value) {
    return String(value || '')
        .split(/[\\/]/)
        .pop()
        .trim()
        .toLocaleLowerCase();
}

function isSameImportedFile(first, second) {
    const firstName = toComparableFilename(first?.filename || first?.title || '');
    const secondName = toComparableFilename(second?.filename || second?.title || '');
    if (!firstName || !secondName || firstName !== secondName) return false;

    const firstSize = Number.isFinite(first?.size) ? Number(first.size) : null;
    const secondSize = Number.isFinite(second?.size) ? Number(second.size) : null;
    if (firstSize !== null && secondSize !== null && firstSize > 0 && secondSize > 0) return firstSize === secondSize;
    if (first?.uri && second?.uri) return first.uri === second.uri;
    return false;
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

async function extractArtworkUri(audioUri, artworkName) {
    const audioFile = new File(audioUri);
    const audioBytes = await audioFile.bytes();
    const metadata = await parseBuffer(audioBytes, { path: audioUri });
    const pictures = metadata.common.picture || [];
    const picture = pictures.find((item) => /front|cover/i.test(`${item.type || ''} ${item.description || ''}`)) || pictures[0];
    if (!picture?.data?.length || !picture.format?.startsWith('image/')) {
        console.warn(`[WaveMusicArtwork] No embedded image found; bytes=${audioBytes.length}, pictures=${pictures.length}`);
        return null;
    }

    const artworkDirectory = new Directory(Paths.document, 'WaveMusicArtwork');
    if (!artworkDirectory.exists) {
        artworkDirectory.create({ intermediates: true, idempotent: true });
    }

    const extension = picture.format.split('/')[1]?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const artworkFile = new File(artworkDirectory, `${artworkName}.${extension}`);
    artworkFile.create({ intermediates: true, overwrite: true });
    artworkFile.write(picture.data);
    const savedArtwork = await artworkFile.bytes();
    if (savedArtwork.length !== picture.data.length) throw new Error('Artwork file was not fully saved');
    console.warn(`[WaveMusicArtwork] Saved image; bytes=${picture.data.length}`);
    return artworkFile.uri;
}

export async function loadImportedTracks() {
    try {
        const saved = JSON.parse((await AsyncStorage.getItem(IMPORTED_TRACKS_KEY)) || '[]');
        if (!Array.isArray(saved)) return [];

        const normalized = [];
        for (const track of saved) {
            if (!track || !(track.uri || track.filename || track.title)) continue;

            const prepared = {
                ...track,
                filename: typeof track.filename === 'string' ? track.filename : (track.title || 'audio-file'),
                size: Number.isFinite(track.size) ? Number(track.size) : 0,
            };

            if (prepared.uri) {
                const file = new File(prepared.uri);
                if (!file.exists) continue;

                if (prepared.artworkExtractionVersion !== ARTWORK_EXTRACTION_VERSION) {
                    try {
                        prepared.artworkUri = await extractArtworkUri(prepared.uri, file.name);
                        prepared.artworkExtractionVersion = ARTWORK_EXTRACTION_VERSION;
                    } catch (error) {
                        console.warn(`[WaveMusicArtwork] Extraction failed for ${prepared.filename}; will retry next launch`, error);
                    }
                }
            }

            normalized.push(prepared);
        }

        await AsyncStorage.setItem(IMPORTED_TRACKS_KEY, JSON.stringify(normalized));
        return normalized;
    } catch {
        return [];
    }
}

export async function importAudioAssets(assets, source = 'files') {
    if (!Array.isArray(assets) || !assets.length) return { additions: [], skipped: 0, canceled: false };
    const importDirectory = new Directory(Paths.document, 'WaveMusicImports');
    if (!importDirectory.exists) {
        importDirectory.create({ intermediates: true, idempotent: true });
    }

    const importedTracks = await loadImportedTracks();
    const additions = [];
    let skipped = 0;
    const seen = [...importedTracks];
    for (const [index, asset] of assets.entries()) {
        const sourceUri = asset?.uri || '';
        if (!sourceUri) {
            skipped += 1;
            continue;
        }

        const filename = typeof asset.name === 'string' && asset.name ? asset.name : `shared-audio-${Date.now()}`;
        const size = Number.isFinite(asset.size) ? Number(asset.size) : 0;
        const candidate = { filename, size, uri: sourceUri };
        if (seen.some((track) => isSameImportedFile(track, candidate))) {
            skipped += 1;
            continue;
        }

        const safeFilename = filename.replace(/[^a-zA-Z0-9._-]+/g, '_');
        const destinationFile = new File(importDirectory, `${Date.now()}-${index}-${safeFilename}`);

        try {
            const sourceFile = new File(sourceUri);
            await sourceFile.copy(destinationFile, { overwrite: true });
            if (!destinationFile.exists) throw new Error('Copied file was not created.');

            let artworkUri = null;
            let artworkExtractionVersion;
            try {
                artworkUri = await extractArtworkUri(destinationFile.uri, destinationFile.name);
                artworkExtractionVersion = ARTWORK_EXTRACTION_VERSION;
            } catch (error) {
                console.warn(`[WaveMusicArtwork] Extraction failed for ${filename}; will retry next launch`, error);
            }

            const track = {
                id: `import:${destinationFile.uri}`,
                uri: destinationFile.uri,
                artworkUri,
                artworkExtractionVersion,
                filename,
                size,
                title: titleFromFilename(filename),
                artist: 'Unknown artist',
                album: 'Imported audio',
                duration: 0,
                creationTime: asset.lastModified || Date.now(),
                source,
            };
            additions.push(track);
            seen.push(track);
        } catch {
            skipped += 1;
        }
    }

    const merged = [...importedTracks, ...additions];
    await saveImportedTracks(merged);
    return { additions, skipped, canceled: false };
}

export async function importAudioFiles() {
    const selection = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: true,
    });
    if (selection.canceled || !selection.assets?.length) return { additions: [], skipped: 0, canceled: true };
    return importAudioAssets(selection.assets);
}

export async function saveImportedTracks(tracks) {
    await AsyncStorage.setItem(IMPORTED_TRACKS_KEY, JSON.stringify(Array.isArray(tracks) ? tracks : []));
}

export async function removeImportedTrack(trackId) {
    const importedTracks = await loadImportedTracks();
    const nextTracks = importedTracks.filter((track) => track.id !== trackId);
    await saveImportedTracks(nextTracks);
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
