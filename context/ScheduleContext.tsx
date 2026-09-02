import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  useEffect(() => {
    const hydrate = async () => {
      const stored = await loadScheduleBlocks();
      setBlocks(stored);
      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  const persist = useCallback((next: ScheduleBlock[]) => {
    void saveScheduleBlocks(next);
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

      if (hasOverlap(blocks, nextBlock)) {
        return null;
      }

      setBlocks((prev) => {
        const without = prev.filter((block) => block.id !== id);
        const next = [...without, nextBlock];
        persist(next);
        return next;
      });

      return id;
    },
    [blocks, persist]
  );

  const deleteBlock = useCallback(
    (blockId: string) => {
      void cancelBlockReminder(blockId);
      setBlocks((prev) => {
        const next = prev.filter((block) => block.id !== blockId);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetSchedule = useCallback(() => {
    for (const block of blocks) {
      void cancelBlockReminder(block.id);
    }
    setBlocks([]);
    persist([]);
  }, [blocks, persist]);

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
