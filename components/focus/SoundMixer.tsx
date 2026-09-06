import React, { useMemo, useRef, useState } from "react";
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
import { fontFamily } from "../../theme/fonts";
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
  const { colors } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { previewMix, stopPreview, isPreviewing } = useSoundscape();
  const sliderWidths = useRef<Partial<Record<SoundscapeId, number>>>({});
  const [tuneOpen, setTuneOpen] = useState(false);

  const mix = settings.soundMix;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: 16,
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
          fontFamily: fontFamily.semiBold,
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
          fontFamily: fontFamily.semiBold,
          color: colors.textSecondary,
        },
        presetRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 4,
        },
        presetChip: {
          flexGrow: 1,
          minWidth: "30%",
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
        },
        presetChipActive: {
          backgroundColor: colors.focus,
          borderColor: colors.focus,
        },
        presetText: {
          fontSize: 14,
          fontWeight: "700",
          fontFamily: fontFamily.bold,
          color: colors.textSecondary,
          textAlign: "center",
        },
        presetTextActive: {
          color: colors.onPrimary,
        },
        presetSub: {
          fontSize: 11,
          color: colors.textMuted,
          marginTop: 2,
          textAlign: "center",
          fontFamily: fontFamily.regular,
        },
        presetSubActive: {
          color: colors.onPrimary,
        },
        tuneToggle: {
          paddingVertical: 12,
          alignItems: "center",
        },
        tuneToggleText: {
          fontSize: 13,
          fontWeight: "600",
          fontFamily: fontFamily.semiBold,
          color: colors.textMuted,
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
          fontFamily: fontFamily.medium,
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
          fontFamily: fontFamily.regular,
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
          fontFamily: fontFamily.regular,
        },
      }),
    [colors]
  );

  const persistMix = (nextMix: SoundMixLayer[], presetId: string | null) => {
    updateSettings({
      soundMix: nextMix,
      activeSoundscapePresetId: presetId,
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
          const active = settings.activeSoundscapePresetId === preset.id;
          const summary = preset.layers
            .map((layer) => SOUNDSCAPE_TRACKS[layer.id]?.label ?? layer.id)
            .join(" · ");
          return (
            <Pressable
              key={preset.id}
              style={[styles.presetChip, active && styles.presetChipActive]}
              onPress={() => applyPreset(preset.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${preset.name} mood`}
            >
              <Text
                style={[styles.presetText, active && styles.presetTextActive]}
              >
                {preset.name}
              </Text>
              <Text style={[styles.presetSub, active && styles.presetSubActive]} numberOfLines={1}>
                {summary}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={styles.tuneToggle}
        onPress={() => setTuneOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: tuneOpen }}
        accessibilityLabel={tuneOpen ? "Hide fine-tuning" : "Fine-tune mix"}
      >
        <Text style={styles.tuneToggleText}>
          {tuneOpen ? "Fine-tune ▾" : "Fine-tune ▸"}
        </Text>
      </Pressable>

      {tuneOpen ? (
        <>
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
                accessibilityRole="switch"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${track.label} track`}
              >
                    <Text style={styles.trackToggleText}>
                      {active ? "On" : "Off"}
                    </Text>
                  </Pressable>
                </View>

              <Pressable
                accessibilityRole="adjustable"
                accessibilityLabel={`${track.label} volume`}
                accessibilityValue={{ now: Math.round(volume * 100), min: 0, max: 100 }}
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
        </>
      ) : null}
    </View>
  );
};
