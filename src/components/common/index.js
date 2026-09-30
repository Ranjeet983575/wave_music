import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_THEME } from '../../constants/theme';

const C = APP_THEME;

export function IconButton({ name, onPress, size = 22, color = C.text, style, accessibilityLabel }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || name}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, style, pressed && styles.pressed]}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

export function ToggleSwitch({ enabled, onToggle, activeColor = C.green }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.togglePill,
        enabled && { backgroundColor: activeColor },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.toggleKnob, enabled && styles.toggleKnobActive]} />
    </Pressable>
  );
}

export function Artwork({ size = 58, iconSize, tint = C.green, rounded = 15, style }) {
  return (
    <View style={[styles.artwork, { width: size, height: size, borderRadius: rounded }, style]}>
      <View style={styles.artworkGlow} />
      <Ionicons name="musical-notes" size={iconSize || size * 0.46} color={tint} />
    </View>
  );
}

export function EmptyState({ icon, title, detail, action, onAction, busy, busyText = 'Scanning library', secondaryAction, onSecondaryAction, stylesOverride }) {
  const currentStyles = stylesOverride || styles;
  return (
    <View style={currentStyles.emptyState}>
      <View style={currentStyles.emptyIcon}><Ionicons name={icon} size={34} color={C.green} /></View>
      <Text style={currentStyles.emptyTitle}>{title}</Text>
      <Text style={currentStyles.emptyDetail}>{detail}</Text>
      {action ? (
        <Pressable onPress={onAction} style={currentStyles.primaryButton}>
          {busy ? <ActivityIndicator color={C.background} /> : <Ionicons name="scan-outline" size={18} color={C.background} />}
          <Text style={currentStyles.primaryButtonText}>{busy ? busyText : action}</Text>
        </Pressable>
      ) : null}
      {secondaryAction ? (
        <Pressable onPress={onSecondaryAction} style={currentStyles.secondaryButton}>
          <Ionicons name="folder-open-outline" size={17} color={C.green} />
          <Text style={currentStyles.secondaryButtonText}>{secondaryAction}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function TrackRow({ track, onPress, onMore, favorite, onFavorite, stylesOverride }) {
  const currentStyles = stylesOverride || styles;

  return (
    <View style={currentStyles.trackRow}>
      <Pressable onPress={onPress} style={currentStyles.trackMain} accessibilityRole="button" accessibilityLabel={`Play ${track.title}`}>
        <Artwork size={56} />
        <View style={currentStyles.trackText}>
          <Text numberOfLines={1} style={currentStyles.trackTitle}>{track.title}</Text>
          <Text numberOfLines={1} style={currentStyles.trackSubtitle}>{track.artist}  ·  {track.album}</Text>
        </View>
      </Pressable>
      <View style={currentStyles.trackMeta}>
        <Text style={currentStyles.trackDuration}>{track.duration ? formatDuration(track.duration) : '--:--'}</Text>
        {favorite ? (
          <IconButton
            name="heart"
            color={C.green}
            size={20}
            onPress={onFavorite}
            accessibilityLabel="Remove from favorites"
          />
        ) : null}
        <IconButton
          name="ellipsis-horizontal"
          color={C.secondary}
          size={20}
          onPress={onMore}
          accessibilityLabel="Track options"
        />
      </View>
    </View>
  );
}

export function formatDuration(duration) {
  if (!Number.isFinite(duration) || duration <= 0) return '0:00';
  const totalSeconds = Math.max(0, Math.floor(duration));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  togglePill: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#434B47',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F4F6F4',
    alignSelf: 'flex-start',
  },
  toggleKnobActive: { alignSelf: 'flex-end' },
  artwork: {
    backgroundColor: '#1A2420',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artworkGlow: {
    position: 'absolute',
    width: '140%',
    height: '140%',
    borderRadius: 100,
    top: '42%',
    backgroundColor: '#24372D',
    opacity: 0.75,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, paddingVertical: 52 },
  emptyIcon: { width: 74, height: 74, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18211C', marginBottom: 19 },
  emptyTitle: { color: C.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  emptyDetail: { color: C.secondary, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 9, maxWidth: 290 },
  primaryButton: { marginTop: 22, paddingHorizontal: 18, minHeight: 45, borderRadius: 14, backgroundColor: C.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { color: C.background, fontSize: 13, fontWeight: '700' },
  secondaryButton: { marginTop: 14, minHeight: 42, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
  secondaryButtonText: { color: C.green, fontSize: 13, fontWeight: '600' },
  trackRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1A201D', gap: 8 },
  trackMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 9 },
  trackText: { flex: 1, minWidth: 0 },
  trackTitle: { color: C.text, fontSize: 14, fontWeight: '600' },
  trackSubtitle: { color: C.secondary, fontSize: 11, marginTop: 5 },
  trackMeta: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  trackDuration: { color: C.dim, fontSize: 11, width: 38, textAlign: 'right' },
});
