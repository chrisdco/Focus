import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { hasOverlap } from "../domain/schedule";
import { loadScheduleBlocks, saveScheduleBlocks } from "../storage";
import { useSettings } from "./SettingsContext";
import { useTasks } from "./TasksContext";
import type { ScheduleBlock, ScheduleBlockDraft } from "../types/schedule";
import {
  cancelBlockReminder,
  syncBlockReminder,
} from "../utils/scheduleReminders";

const createId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface ScheduleContextValue {
  blocks: ScheduleBlock[];
  isHydrated: boolean;
  upsertBlock: (draft: ScheduleBlockDraft, existingId?: string) => string | null;
  deleteBlock: (blockId: string) => void;
  resetSchedule: () => void;
}

const ScheduleContext = createContext<ScheduleContextValue | undefined>(
  undefined
);

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({
  children,
}) => {
  const { settings } = useSettings();
  const { tasks } = useTasks();
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  // Synchronous source of truth so rapid upserts can't both pass the
  // overlap check on a stale closure before re-render.
  const blocksRef = useRef<ScheduleBlock[]>([]);
  blocksRef.current = blocks;

  useEffect(() => {
    const hydrate = async () => {
      const stored = await loadScheduleBlocks();
      setBlocks(stored);
      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  const persist = useCallback((next: ScheduleBlock[]) => {
    void saveScheduleBlocks(next).catch(() => undefined);
  }, []);

  const resolveTitle = useCallback(
    (block: ScheduleBlock): string => {
      if (!block.taskId) {
        return "Focus session";
      }
      return tasks.find((task) => task.id === block.taskId)?.title ?? "Focus session";
    },
    [tasks]
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    for (const block of blocks) {
      void syncBlockReminder(
        block,
        settings.notificationsEnabled,
        settings.soundEnabled,
        resolveTitle(block)
      );
    }
  }, [
    blocks,
    isHydrated,
    resolveTitle,
    settings.notificationsEnabled,
    settings.soundEnabled,
  ]);

  const upsertBlock = useCallback(
    (draft: ScheduleBlockDraft, existingId?: string): string | null => {
      const id = existingId ?? createId();
      const nextBlock: ScheduleBlock = {
        id,
        dateKey: draft.dateKey,
        startMinutes: Math.max(0, Math.min(23 * 60 + 59, draft.startMinutes)),
        durationMinutes: Math.max(5, Math.min(180, draft.durationMinutes)),
        kind: draft.kind,
        taskId: draft.taskId,
      };

      // Check against the ref (synchronously updated) so two rapid calls
      // can't both sneak past on stale state.
      const current = blocksRef.current.filter((block) => block.id !== id);
      if (hasOverlap(current, nextBlock)) {
        return null;
      }

      const next = [...current, nextBlock];
      blocksRef.current = next;
      setBlocks(next);
      persist(next);

      return id;
    },
    [persist]
  );

  const deleteBlock = useCallback(
    (blockId: string) => {
      void cancelBlockReminder(blockId).catch(() => undefined);
      const next = blocksRef.current.filter((block) => block.id !== blockId);
      blocksRef.current = next;
      setBlocks(next);
      persist(next);
    },
    [persist]
  );

  const resetSchedule = useCallback(() => {
    for (const block of blocksRef.current) {
      void cancelBlockReminder(block.id).catch(() => undefined);
    }
    blocksRef.current = [];
    setBlocks([]);
    persist([]);
  }, [persist]);

  const value = useMemo(
    () => ({
      blocks,
      isHydrated,
      upsertBlock,
      deleteBlock,
      resetSchedule,
    }),
    [blocks, deleteBlock, isHydrated, resetSchedule, upsertBlock]
  );

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = (): ScheduleContextValue => {
  const context = useContext(ScheduleContext);

  if (!context) {
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }

  return context;
};
