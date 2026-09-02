import type { Task } from "../types/task";
import type { ScheduleBlock, ScheduleBlockKind } from "../types/schedule";
import { REMINDER_LEAD_MINUTES } from "../types/schedule";
import { toDateKey } from "../utils/timer";

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22;
export const HOUR_HEIGHT = 56;

export const shiftDateKey = (dateKey: string, days: number): string => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateKey(date.getTime());
};

export const formatClock = (minutes: number): string => {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const parseClock = (hours: number, minutes: number): number =>
  Math.max(0, Math.min(23, hours)) * 60 + Math.max(0, Math.min(59, minutes));

export const getBlocksForDate = (
  blocks: ScheduleBlock[],
  dateKey: string
): ScheduleBlock[] =>
  blocks
    .filter((block) => block.dateKey === dateKey)
    .sort((a, b) => a.startMinutes - b.startMinutes);

export const blocksOverlap = (
  left: Pick<ScheduleBlock, "dateKey" | "startMinutes" | "durationMinutes">,
  right: Pick<ScheduleBlock, "dateKey" | "startMinutes" | "durationMinutes">
): boolean => {
  if (left.dateKey !== right.dateKey) {
    return false;
  }

  const leftEnd = left.startMinutes + left.durationMinutes;
  const rightEnd = right.startMinutes + right.durationMinutes;
  return left.startMinutes < rightEnd && right.startMinutes < leftEnd;
};

export const hasOverlap = (
  blocks: ScheduleBlock[],
  candidate: Pick<
    ScheduleBlock,
    "id" | "dateKey" | "startMinutes" | "durationMinutes"
  >
): boolean =>
  blocks.some(
    (block) =>
      block.id !== candidate.id &&
      blocksOverlap(block, candidate)
  );

export const pomodorosFromMinutes = (durationMinutes: number): number =>
  Math.max(1, Math.ceil(durationMinutes / 25));

export const getScheduledPomodoros = (
  blocks: ScheduleBlock[],
  dateKey: string
): number =>
  getBlocksForDate(blocks, dateKey)
    .filter((block) => block.kind === "focus")
    .reduce((sum, block) => sum + pomodorosFromMinutes(block.durationMinutes), 0);

export const getPlannedTaskPomodoros = (
  tasks: Task[],
  dateKey: string
): number =>
  tasks
    .filter(
      (task) => task.status === "active" && task.dueDate === dateKey
    )
    .reduce(
      (sum, task) =>
        sum + Math.max(0, task.estimatedPomodoros - task.completedPomodoros),
      0
    );

export const getPlannedPomodoroCount = (
  tasks: Task[],
  blocks: ScheduleBlock[],
  dateKey: string
): number =>
  getPlannedTaskPomodoros(tasks, dateKey) +
  getScheduledPomodoros(blocks, dateKey);

export const blockStartDate = (block: ScheduleBlock): Date => {
  const start = new Date(`${block.dateKey}T00:00:00`);
  start.setMinutes(block.startMinutes);
  return start;
};

export const reminderDate = (block: ScheduleBlock): Date => {
  const start = blockStartDate(block);
  return new Date(start.getTime() - REMINDER_LEAD_MINUTES * 60 * 1000);
};

export const reminderIdentifier = (blockId: string): string =>
  `foco-block-${blockId}`;

export const kindLabel = (kind: ScheduleBlockKind): string => {
  if (kind === "shortBreak") {
    return "Short break";
  }
  if (kind === "longBreak") {
    return "Long break";
  }
  return "Focus";
};
