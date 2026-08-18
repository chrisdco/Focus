import React, { useMemo, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SOUNDSCAPE_PRESETS } from "../../data/soundscapePresets";
import { useSettings } from "../../context/SettingsContext";
import { useSoundscape } from "../../context/SoundscapeContext";
import { useTheme } from "../../context/ThemeContext";
import { cardElevation } from "../../theme/shadows";
import {
  MAX_MIX_LAYERS,
  SOUNDSCAPE_IDS,
  SOUNDSCAPE_TRACKS,
  type SoundMixLayer,
  type SoundscapeId,
} from "../../types/soundscape";
import { normalizeSoundMix } from "../../types/settings";

const layerVolume = (mix: SoundMixLayer[], id: SoundscapeId): number =>
  mix.find((layer) => layer.id === id)?.volume ?? 0;

const upsertLayer = (
  mix: SoundMixLayer[],
  id: SoundscapeId,
  volume: number
): SoundMixLayer[] => {
  const without = mix.filter((layer) => layer.id !== id);
  if (volume <= 0) {
    return without;
  }
  return normalizeSoundMix([...without, { id, volume }]);
};

export const SoundMixer: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { previewMix, stopPreview, isPreviewing } = useSoundscape();
  const sliderWidths = useRef<Partial<Record<SoundscapeId, number>>>({});

  const mix = settings.soundMix;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
          ...cardElevation(isDark),
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        },
        title: {
          fontSize: 17,
          fontWeight: "600",
          color: colors.text,
        },
        previewButton: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
        },
        previewText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        presetRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 14,
        },
        presetChip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
        },
        presetChipActive: {
          backgroundColor: colors.focus,
          borderColor: colors.focus,
        },
        presetText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        presetTextActive: {
          color: colors.onPrimary,
        },
        trackRow: {
          marginBottom: 12,
        },
        trackHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        },
        trackLabel: {
          fontSize: 15,
          color: colors.text,
          fontWeight: "500",
        },
        trackToggle: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
        },
        trackToggleActive: {
          backgroundColor: `${colors.focus}22`,
          borderColor: colors.focus,
        },
        trackToggleText: {
          fontSize: 12,
          color: colors.textMuted,
        },
        sliderTrack: {
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.track,
          overflow: "hidden",
        },
        sliderFill: {
          height: "100%",
          borderRadius: 4,
          backgroundColor: colors.focus,
        },
        hint: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 4,
        },
      }),
    [colors, isDark]
  );

  const persistMix = (nextMix: SoundMixLayer[], presetId: string | null) => {
    updateSettings({
      soundMix: nextMix,
      activePresetId: presetId,
    });
    if (isPreviewing) {
      previewMix(nextMix);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = SOUNDSCAPE_PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }
    persistMix(preset.layers, preset.id);
  };

  const toggleTrack = (id: SoundscapeId) => {
    const current = layerVolume(mix, id);
    if (current > 0) {
      persistMix(upsertLayer(mix, id, 0), null);
      return;
    }

    if (mix.length >= MAX_MIX_LAYERS) {
      return;
    }

    persistMix(upsertLayer(mix, id, 0.5), null);
  };

  const setTrackVolume = (id: SoundscapeId, volume: number) => {
    persistMix(upsertLayer(mix, id, volume), null);
  };

  const handleSliderPress = (id: SoundscapeId, locationX: number) => {
    const width = sliderWidths.current[id] ?? 0;
    if (width <= 0) {
      return;
    }

    const volume = Math.max(0, Math.min(1, locationX / width));
    if (
      volume > 0 &&
      !mix.some((layer) => layer.id === id) &&
      mix.length >= MAX_MIX_LAYERS
    ) {
      return;
    }

    setTrackVolume(id, volume);
  };

  const handlePreviewPress = () => {
    if (isPreviewing) {
      stopPreview();
      return;
    }
    previewMix(mix);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus Room</Text>
        <Pressable style={styles.previewButton} onPress={handlePreviewPress}>
          <Text style={styles.previewText}>
            {isPreviewing ? "Stop preview" : "Preview mix"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.presetRow}>
        {SOUNDSCAPE_PRESETS.map((preset) => {
          const active = settings.activePresetId === preset.id;
          return (
            <Pressable
              key={preset.id}
              style={[styles.presetChip, active && styles.presetChipActive]}
              onPress={() => applyPreset(preset.id)}
            >
              <Text
                style={[styles.presetText, active && styles.presetTextActive]}
              >
                {preset.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {SOUNDSCAPE_IDS.map((id) => {
        const track = SOUNDSCAPE_TRACKS[id];
        const volume = layerVolume(mix, id);
        const active = volume > 0;

        return (
          <View key={id} style={styles.trackRow}>
            <View style={styles.trackHeader}>
              <Text style={styles.trackLabel}>
                {track.emoji} {track.label}
              </Text>
              <Pressable
                style={[styles.trackToggle, active && styles.trackToggleActive]}
                onPress={() => toggleTrack(id)}
              >
                <Text style={styles.trackToggleText}>
                  {active ? "On" : "Off"}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onLayout={(event) => {
                sliderWidths.current[id] = event.nativeEvent.layout.width;
              }}
              onPress={(event) =>
                handleSliderPress(id, event.nativeEvent.locationX)
              }
            >
              <View style={styles.sliderTrack}>
                <View
                  style={[styles.sliderFill, { width: `${volume * 100}%` }]}
                />
              </View>
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.hint}>
        Mix up to {MAX_MIX_LAYERS} tracks. Your mix saves automatically.
      </Text>
    </View>
  );
};
