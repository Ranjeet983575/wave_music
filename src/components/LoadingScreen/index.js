import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_APPEARANCE_SETTINGS, loadAppearanceSettings } from '../../data/appearanceSettings';

const COLORS = {
    background: '#101412',
    muted: '#8D9991',
    lightBackground: '#F3F6F4',
    lightText: '#17231C',
    lightMuted: '#526159',
};

export default function LoadingScreen() {
    const appear = useRef(new Animated.Value(0)).current;
    const float = useRef(new Animated.Value(0)).current;
    const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE_SETTINGS);

    useEffect(() => {
        let isMounted = true;
        loadAppearanceSettings().then((settings) => {
            if (isMounted) setAppearance(settings);
        });
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
        return () => { isMounted = false; };
    }, [appear, float]);

    const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [8, -8] });
    const scale = appear.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
    const isLightTheme = appearance.themeMode === 'Light';
    const backgroundColor = isLightTheme ? COLORS.lightBackground : COLORS.background;
    const textColor = isLightTheme ? COLORS.lightText : '#F3F7F4';
    const mutedColor = isLightTheme ? COLORS.lightMuted : COLORS.muted;

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={[styles.topLine, { backgroundColor: appearance.accent }]} />
            <Animated.View style={[styles.markWrap, { opacity: appear, transform: [{ translateY }, { scale }] }]}>
                <View style={[styles.markGlow, { backgroundColor: appearance.accent }]} />
                <View style={[styles.mark, { backgroundColor: appearance.accent }]}>
                    <Ionicons name="musical-notes" size={48} color={backgroundColor} />
                </View>
            </Animated.View>
            <Animated.View style={{ opacity: appear, alignItems: 'center' }}>
                <Text style={[styles.brand, { color: textColor }]}>WAVE MUSIC</Text>
                <Text style={[styles.tagline, { color: mutedColor }]}>Your sound, in motion.</Text>
            </Animated.View>
            <View style={styles.loadingRow}>
                <View style={[styles.loadingDot, { backgroundColor: appearance.accent }]} />
                <Text style={[styles.loadingText, { color: mutedColor }]}>Tuning your library</Text>
            </View>
            <Text style={[styles.developerCredit, { color: mutedColor }]}>Developed by ranjeet Kumar Prajapati</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    topLine: {
        position: 'absolute',
        top: 0,
        left: 28,
        right: 28,
        height: 2,
        opacity: 0.65,
    },
    markWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 42 },
    markGlow: {
        position: 'absolute',
        width: 146,
        height: 146,
        borderRadius: 73,
        opacity: 0.08,
    },
    mark: {
        width: 108,
        height: 108,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '-7deg' }],
    },
    brand: { fontSize: 20, fontWeight: '800', letterSpacing: 3 },
    tagline: { fontSize: 15, marginTop: 10 },
    loadingRow: { position: 'absolute', bottom: 74, flexDirection: 'row', alignItems: 'center', gap: 10 },
    loadingDot: { width: 7, height: 7, borderRadius: 4 },
    loadingText: { fontSize: 13 },
    developerCredit: { position: 'absolute', bottom: 32, fontSize: 12 },
});