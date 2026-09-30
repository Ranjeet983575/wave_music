import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import PlayerScreen from './src/screens/PlayerScreen';

export default function App() {
    return (
        <SafeAreaView style={styles.container}>
            <PlayerScreen />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' }
});
