import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    AppState,
    Image,
    Pressable,
    Text,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function IconButton({ name, onPress, size = 22, color = '#FFFFFF', style, accessibilityLabel, styles }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel || name}
            onPress={onPress}
            style={({ pressed }) => [styles?.iconButton, style, pressed && styles?.pressed]}
        >
            <Ionicons name={name} size={size} color={color} />
        </Pressable>
    );
}

export function ToggleSwitch({ enabled, onToggle, activeColor = '#3DDC84', styles }) {
    return (
        <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: enabled }}
            onPress={onToggle}
            style={({ pressed }) => [
                styles?.togglePill,
                enabled && { backgroundColor: activeColor },
                pressed && styles?.pressed,
            ]}
        >
            <View style={[styles?.toggleKnob, enabled && styles?.toggleKnobActive]} />
        </Pressable>
    );
}

export function Artwork({ size = 58, iconSize, tint = '#3DDC84', rounded = 15, uri, styles }) {
    return (
        <View style={[styles?.artwork, { width: size, height: size, borderRadius: rounded }]}>
            {uri ? (
                <Image source={{ uri }} style={styles?.artworkImage} resizeMode="cover" />
            ) : (
                <>
                    <View style={styles?.artworkGlow} />
                    <Ionicons name="musical-notes" size={iconSize || size * 0.46} color={tint} />
                </>
            )}
        </View>
    );
}

function TrackPlaybackIndicator({ isPlaying, accentColor, styles }) {
    const [appIsActive, setAppIsActive] = useState(AppState.currentState === 'active');
    const [scales] = useState(() => [0.5, 0.8, 0.6, 0.9].map((scale) => new Animated.Value(scale)));

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            setAppIsActive(nextState === 'active');
        });
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (!isPlaying || !appIsActive) {
            scales.forEach((scale, index) => {
                scale.stopAnimation();
                scale.setValue([0.5, 0.8, 0.6, 0.9][index]);
            });
            return undefined;
        }

        const animations = scales.map((scale, index) => Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.5,
                    duration: 260 + index * 45,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 0.45,
                    duration: 300 + index * 35,
                    useNativeDriver: true,
                }),
            ]),
        ));
        animations.forEach((animation) => animation.start());

        return () => animations.forEach((animation) => animation.stop());
    }, [appIsActive, isPlaying, scales]);

    if (!isPlaying) {
        return <Ionicons name="pause" size={13} color={accentColor} />;
    }

    return (
        <View style={styles.trackPlayingBars}>
            {scales.map((scale, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.trackPlayingBar,
                        { backgroundColor: accentColor, transform: [{ scaleY: scale }] },
                    ]}
                />
            ))}
        </View>
    );
}

export function TrackRow({ track, index, onPress, onMore, favorite, onFavorite, isCurrentTrack, isPlaying, stylesOverride, accentColor = '#3DDC84', secondaryColor = '#A7B2AE', formatDuration, C }) {
    const rowStyles = stylesOverride || {};
    return (
        <View style={rowStyles.trackRow}>
            <Pressable
                onPress={onPress}
                style={rowStyles.trackMain}
                accessibilityRole="button"
                accessibilityLabel={isCurrentTrack ? `${track.title}, ${isPlaying ? 'currently playing' : 'current track, paused'}` : `Play ${track.title}`}
            >
                <View style={rowStyles.trackArtworkContainer}>
                    <Artwork size={56} tint={accentColor} uri={track.artworkUri} styles={rowStyles} />
                    {isCurrentTrack ? (
                        <View
                            accessibilityElementsHidden
                            importantForAccessibility="no"
                            style={rowStyles.trackPlayingIndicator}
                        >
                            <TrackPlaybackIndicator isPlaying={isPlaying} accentColor={accentColor} styles={rowStyles} />
                        </View>
                    ) : null}
                </View>
                <View style={rowStyles.trackText}>
                    <Text numberOfLines={1} style={[rowStyles.trackTitle, isCurrentTrack && { color: accentColor }]}>{track.title}</Text>
                    <Text numberOfLines={1} style={rowStyles.trackSubtitle}>{track.artist}  ·  {track.album}</Text>
                </View>
            </Pressable>
            <View style={rowStyles.trackMeta}>
                <Text style={rowStyles.trackDuration}>{track.duration ? formatDuration(track.duration) : '--:--'}</Text>
                {favorite ? <IconButton
                    name="heart"
                    color={accentColor}
                    size={20}
                    onPress={onFavorite}
                    accessibilityLabel="Remove from favorites"
                    styles={rowStyles}
                /> : null}
                <IconButton
                    name="ellipsis-horizontal"
                    color={secondaryColor}
                    size={20}
                    onPress={onMore}
                    accessibilityLabel="Track options"
                    styles={rowStyles}
                />
            </View>
        </View>
    );
}

export function EmptyState({ icon, title, detail, action, onAction, busy, busyText = 'Scanning library', secondaryAction, onSecondaryAction, stylesOverride, accentColor = '#3DDC84', backgroundColor = '#F5F5F5' }) {
    const emptyStyles = stylesOverride || {};
    return (
        <View style={emptyStyles.emptyState}>
            <View style={emptyStyles.emptyIcon}><Ionicons name={icon} size={34} color={accentColor} /></View>
            <Text style={emptyStyles.emptyTitle}>{title}</Text>
            <Text style={emptyStyles.emptyDetail}>{detail}</Text>
            {action ? (
                <Pressable onPress={onAction} style={emptyStyles.primaryButton}>
                    {busy ? <ActivityIndicator color={backgroundColor} /> : <Ionicons name="scan-outline" size={18} color={backgroundColor} />}
                    <Text style={emptyStyles.primaryButtonText}>{busy ? busyText : action}</Text>
                </Pressable>
            ) : null}
            {secondaryAction ? (
                <Pressable onPress={onSecondaryAction} style={emptyStyles.secondaryButton}>
                    <Ionicons name="folder-open-outline" size={17} color={accentColor} />
                    <Text style={emptyStyles.secondaryButtonText}>{secondaryAction}</Text>
                </Pressable>
            ) : null}
        </View>
    );
}
