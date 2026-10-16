import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from './src/components/LoadingScreen';
import PlayerScreen from './src/screens/PlayerScreen';

export default function App() {
    const [booting, setBooting] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setBooting(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                {booting ? <LoadingScreen /> : <PlayerScreen />}
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0C0B' }
});
