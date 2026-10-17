export const APP_THEME = {
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

export const LIGHT_THEME = {
    background: '#F3F6F4',
    surface: '#FFFFFF',
    surfaceRaised: '#E8EEEA',
    border: '#D5DED8',
    green: '#248653',
    text: '#17231C',
    secondary: '#526159',
    dim: '#77847C',
    danger: '#C13F3A',
};

export const ACCENT_COLORS = [
    APP_THEME.green,
    '#43C5B4',
    '#8BCAFF',
    '#8795F7',
    '#D2A7FF',
    '#F07F9D',
    '#FF9C83',
    '#F2A24A'
];

export const TABS = [
    { key: 'Tracks', icon: 'musical-notes-outline' },
    { key: 'Playlists', icon: 'list-outline' },
    { key: 'Albums', icon: 'albums-outline' },
    { key: 'Import', icon: 'add-circle-outline' },
    { key: 'Settings', icon: 'settings-outline' },
];

export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESET_GAINS_DB = {
    Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'Bass Boost': [6, 5, 4, 2, 0, 0, 0, 0, -1, -2],
    Treble: [-2, -1, 0, 0, 0, 1, 2, 4, 5, 5],
    Rock: [4, 3, 1, -1, -2, 1, 3, 4, 3, 3],
    Pop: [-1, 1, 3, 4, 2, 0, 1, 2, 3, 2],
    Classical: [3, 2, 1, 0, -1, -1, 0, 2, 3, 4],
    Jazz: [3, 2, 0, -1, -2, 0, 2, 3, 2, 2],
    Dance: [5, 4, 2, 0, -1, 1, 3, 4, 5, 3],
};

export const PRESET_MAP = {
    Custom: Array(10).fill(0.5),
    ...Object.fromEntries(
        Object.entries(EQ_PRESET_GAINS_DB).map(([name, gains]) => [
            name,
            gains.map((gain) => (gain + 12) / 24),
        ]),
    ),
};
