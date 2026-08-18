import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";

import {
  SOUNDSCAPE_IDS,
  SOUNDSCAPE_TRACKS,
  type SoundMixLayer,
  type SoundscapeId,
} from "../types/soundscape";

const FADE_MS = 500;
const FADE_STEPS = 10;

interface SoundscapeContextValue {
  isPlaying: boolean;
  isPreviewing: boolean;
  applyMix: (mix: SoundMixLayer[]) => void;
  fadeInMix: (mix: SoundMixLayer[]) => void;
  fadeOutMix: () => void;
  previewMix: (mix: SoundMixLayer[]) => void;
  stopPreview: () => void;
  setLayerVolume: (id: SoundscapeId, volume: number) => void;
}

const SoundscapeContext = createContext<SoundscapeContextValue | undefined>(
  undefined
);

interface SoundscapeProviderProps {
  children: ReactNode;
}

const layerVolumeMap = (mix: SoundMixLayer[]): Map<SoundscapeId, number> => {
  const map = new Map<SoundscapeId, number>();
  for (const layer of mix) {
    map.set(layer.id, layer.volume);
  }
  return map;
};

export const SoundscapeProvider: React.FC<SoundscapeProviderProps> = ({
  children,
}) => {
  const playersRef = useRef<Map<SoundscapeId, AudioPlayer>>(new Map());
  const fadeTimersRef = useRef<Map<SoundscapeId, ReturnType<typeof setInterval>>>(
    new Map()
  );
  const activeMixRef = useRef<SoundMixLayer[]>([]);
  const isPlayingRef = useRef(false);
  const isPreviewingRef = useRef(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPreviewing, setIsPreviewing] = React.useState(false);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    });

    const players = new Map<SoundscapeId, AudioPlayer>();
    for (const id of SOUNDSCAPE_IDS) {
      const player = createAudioPlayer(SOUNDSCAPE_TRACKS[id].source);
      player.loop = true;
      player.volume = 0;
      players.set(id, player);
    }
    playersRef.current = players;

    return () => {
      fadeTimersRef.current.forEach((timer) => clearInterval(timer));
      fadeTimersRef.current.clear();
      players.forEach((player) => player.release());
      playersRef.current.clear();
    };
  }, []);

  const clearFade = useCallback((id: SoundscapeId) => {
    const timer = fadeTimersRef.current.get(id);
    if (timer) {
      clearInterval(timer);
      fadeTimersRef.current.delete(id);
    }
  }, []);

  const setPlayerVolume = useCallback(
    (id: SoundscapeId, volume: number) => {
      const player = playersRef.current.get(id);
      if (!player) {
        return;
      }

      const clamped = Math.max(0, Math.min(1, volume));
      player.volume = clamped;

      if (clamped > 0 && !player.playing) {
        player.play();
      }

      if (clamped === 0 && player.playing) {
        player.pause();
      }
    },
    []
  );

  const fadeVolumes = useCallback(
    (
      targets: Map<SoundscapeId, number>,
      onComplete?: () => void
    ) => {
      const stepMs = FADE_MS / FADE_STEPS;
      let pending = 0;

      for (const id of SOUNDSCAPE_IDS) {
        clearFade(id);
        const player = playersRef.current.get(id);
        if (!player) {
          continue;
        }

        const start = player.volume;
        const target = targets.get(id) ?? 0;

        if (Math.abs(start - target) < 0.01) {
          setPlayerVolume(id, target);
          continue;
        }

        pending += 1;
        let step = 0;

        const timer = setInterval(() => {
          step += 1;
          const next = start + ((target - start) * step) / FADE_STEPS;
          setPlayerVolume(id, next);

          if (step >= FADE_STEPS) {
            clearFade(id);
            setPlayerVolume(id, target);
            pending -= 1;
            if (pending === 0) {
              onComplete?.();
            }
          }
        }, stepMs);

        fadeTimersRef.current.set(id, timer);
      }

      if (pending === 0) {
        onComplete?.();
      }
    },
    [clearFade, setPlayerVolume]
  );

  const applyMix = useCallback(
    (mix: SoundMixLayer[]) => {
      activeMixRef.current = mix;
      const targets = new Map<SoundscapeId, number>();
      for (const id of SOUNDSCAPE_IDS) {
        targets.set(id, 0);
      }
      for (const layer of mix) {
        targets.set(layer.id, layer.volume);
      }
      fadeVolumes(targets);
      const hasAudio = mix.some((layer) => layer.volume > 0);
      isPlayingRef.current = hasAudio;
      setIsPlaying(hasAudio);
    },
    [fadeVolumes]
  );

  const fadeInMix = useCallback(
    (mix: SoundMixLayer[]) => {
      isPreviewingRef.current = false;
      setIsPreviewing(false);
      applyMix(mix);
    },
    [applyMix]
  );

  const fadeOutMix = useCallback(() => {
    activeMixRef.current = [];
    const targets = new Map<SoundscapeId, number>();
    for (const id of SOUNDSCAPE_IDS) {
      targets.set(id, 0);
    }

    fadeVolumes(targets, () => {
      isPlayingRef.current = false;
      isPreviewingRef.current = false;
      setIsPlaying(false);
      setIsPreviewing(false);
    });
  }, [fadeVolumes]);

  const previewMix = useCallback(
    (mix: SoundMixLayer[]) => {
      isPreviewingRef.current = true;
      setIsPreviewing(true);
      applyMix(mix);
    },
    [applyMix]
  );

  const stopPreview = useCallback(() => {
    if (!isPreviewingRef.current) {
      return;
    }
    fadeOutMix();
  }, [fadeOutMix]);

  const setLayerVolume = useCallback(
    (id: SoundscapeId, volume: number) => {
      const mixMap = layerVolumeMap(activeMixRef.current);
      if (volume <= 0) {
        mixMap.delete(id);
      } else {
        mixMap.set(id, volume);
      }

      activeMixRef.current = [...mixMap.entries()].map(([layerId, layerVolume]) => ({
        id: layerId,
        volume: layerVolume,
      }));

      setPlayerVolume(id, volume);
      const hasAudio = activeMixRef.current.some((layer) => layer.volume > 0);
      isPlayingRef.current = hasAudio;
      setIsPlaying(hasAudio);
    },
    [setPlayerVolume]
  );

  const value = useMemo(
    () => ({
      isPlaying,
      isPreviewing,
      applyMix,
      fadeInMix,
      fadeOutMix,
      previewMix,
      stopPreview,
      setLayerVolume,
    }),
    [
      applyMix,
      fadeInMix,
      fadeOutMix,
      isPlaying,
      isPreviewing,
      previewMix,
      setLayerVolume,
      stopPreview,
    ]
  );

  return (
    <SoundscapeContext.Provider value={value}>
      {children}
    </SoundscapeContext.Provider>
  );
};

export const useSoundscape = (): SoundscapeContextValue => {
  const context = useContext(SoundscapeContext);

  if (!context) {
    throw new Error("useSoundscape must be used within a SoundscapeProvider");
  }

  return context;
};
