import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, StyleSheet, View } from 'react-native';

const BAR_COUNT = 37;
const BASE_LEVELS = Array.from({ length: BAR_COUNT }, (_, index) => 0.18 + Math.abs(Math.sin(index * 0.73)) * 0.36);

export default function WaveformVisualizer({ playing, accent }) {
    const levels = useRef(BASE_LEVELS.map((level) => new Animated.Value(level))).current;
    const [appIsActive, setAppIsActive] = useState(AppState.currentState === 'active');

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            setAppIsActive(nextAppState === 'active');
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (!playing || !appIsActive) {
            levels.forEach((level, index) => {
                level.stopAnimation();
                level.setValue(BASE_LEVELS[index]);
            });
            return undefined;
        }

        const animations = levels.map((level, index) => {
            const low = 0.14 + ((index * 7) % 5) * 0.045;
            const high = 0.42 + ((index * 11) % 8) * 0.065;
            const animation = Animated.loop(Animated.sequence([
                Animated.delay((index % 6) * 55),
                Animated.timing(level, {
                    toValue: high,
                    duration: 220 + (index % 4) * 65,
                    useNativeDriver: false,
                }),
                Animated.timing(level, {
                    toValue: low,
                    duration: 260 + (index % 3) * 75,
                    useNativeDriver: false,
                }),
            ]));
            animation.start();
            return animation;
        });

        return () => animations.forEach((animation) => animation.stop());
    }, [appIsActive, levels, playing]);

    return (
        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.container}>
            {levels.map((level, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.bar,
                        {
                            backgroundColor: accent,
                            height: level.interpolate({ inputRange: [0, 1], outputRange: [3, 20] }),
                        },
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { height: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, overflow: 'hidden' },
    bar: { width: 3, minHeight: 3, borderRadius: 2, opacity: 0.9 },
});
