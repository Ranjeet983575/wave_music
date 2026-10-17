import React from 'react';
import {
    ActivityIndicator,
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

export function TrackRow({ track, index, onPress, onMore, favorite, onFavorite, stylesOverride, accentColor = '#3DDC84', secondaryColor = '#A7B2AE', formatDuration, C }) {
    const rowStyles = stylesOverride || {};
    return (
        <View style={rowStyles.trackRow}>
            <Pressable onPress={onPress} style={rowStyles.trackMain} accessibilityRole="button" accessibilityLabel={`Play ${track.title}`}>
                <Artwork size={56} tint={accentColor} uri={track.artworkUri} styles={rowStyles} />
                <View style={rowStyles.trackText}>
                    <Text numberOfLines={1} style={rowStyles.trackTitle}>{track.title}</Text>
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
