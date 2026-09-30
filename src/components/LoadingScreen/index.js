import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    background: '#101412',
    green: '#67E59B',
    muted: '#8D9991',
};

export default function LoadingScreen() {
    const appear = useRef(new Animated.Value(0)).current;
    const float = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(appear, {
            toValue: 1,
            duration: 650,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
        Animated.loop(Animated.sequence([
            Animated.timing(float, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(float, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])).start();
    }, [appear, float]);

    const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [8, -8] });
    const scale = appear.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });

    return (
        <View style={styles.container}>
            <View style={styles.topLine} />
            <Animated.View style={[styles.markWrap, { opacity: appear, transform: [{ translateY }, { scale }] }]}>
                <View style={styles.markGlow} />
                <View style={styles.mark}>
                    <Ionicons name="musical-notes" size={48} color={COLORS.background} />
                </View>
            </Animated.View>
            <Animated.View style={{ opacity: appear, alignItems: 'center' }}>
                <Text style={styles.brand}>WAVE MUSIC</Text>
                <Text style={styles.tagline}>Your sound, in motion.</Text>
            </Animated.View>
            <View style={styles.loadingRow}>
                <View style={styles.loadingDot} />
                <Text style={styles.loadingText}>Tuning your library</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
        padding: 32,
    },
    topLine: {
        position: 'absolute',
        top: 0,
        left: 28,
        right: 28,
        height: 2,
        backgroundColor: COLORS.green,
        opacity: 0.65,
    },
    markWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 42 },
    markGlow: {
        position: 'absolute',
        width: 146,
        height: 146,
        borderRadius: 73,
        backgroundColor: COLORS.green,
        opacity: 0.08,
    },
    mark: {
        width: 108,
        height: 108,
        borderRadius: 34,
        backgroundColor: COLORS.green,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '-7deg' }],
    },
    brand: { color: '#F3F7F4', fontSize: 20, fontWeight: '800', letterSpacing: 3 },
    tagline: { color: COLORS.muted, fontSize: 15, marginTop: 10 },
    loadingRow: { position: 'absolute', bottom: 74, flexDirection: 'row', alignItems: 'center', gap: 10 },
    loadingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green },
    loadingText: { color: COLORS.muted, fontSize: 13 },
});