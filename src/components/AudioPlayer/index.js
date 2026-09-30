import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export default function AudioPlayer({ source, title = 'Track' }) {
    const player = useAudioPlayer(source, { updateInterval: 500 });
    const status = useAudioPlayerStatus(player);

    useEffect(() => {
        setAudioModeAsync({ playsInSilentMode: true }).catch((error) => {
            console.warn('Failed to configure audio mode', error);
        });
    }, []);

    function playPause() {
        if (status.playing) {
            player.pause();
        } else {
            player.play();
        }
    }

    function stop() {
        player.pause();
        player.seekTo(0).catch((error) => {
            console.warn('Failed to reset audio position', error);
        });
    }

    function format(seconds) {
        const totalSeconds = Math.floor(seconds || 0);
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.time}>{format(status.currentTime)} / {format(status.duration)}</Text>
            {status.error ? <Text style={styles.error}>{status.error}</Text> : null}
            <View style={styles.controls}>
                <Button title={status.playing ? 'Pause' : 'Play'} onPress={playPause} disabled={!status.isLoaded} />
                <Button title="Stop" onPress={stop} disabled={!status.isLoaded} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 18, marginBottom: 8 },
    time: { marginBottom: 12, color: '#555' },
    error: { marginBottom: 12, color: '#b00020' },
    controls: { flexDirection: 'row', justifyContent: 'space-around' }
});
