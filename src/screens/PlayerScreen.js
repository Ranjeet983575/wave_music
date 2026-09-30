import React from 'react';
import { View, StyleSheet } from 'react-native';
import AudioPlayer from '../components/AudioPlayer';

export default function PlayerScreen() {
    const sample = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    return (
        <View style={styles.page}>
            <AudioPlayer source={sample} title={'Sample Track'} />
        </View>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, justifyContent: 'center', padding: 16 }
});
