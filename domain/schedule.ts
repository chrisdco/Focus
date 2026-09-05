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

export const pomodorosFromMinutes = (
  durationMinutes: number,
  focusMinutes = 25
): number =>
  Math.max(1, Math.ceil(durationMinutes / Math.max(1, focusMinutes)));

export const getScheduledPomodoros = (
  blocks: ScheduleBlock[],
  dateKey: string,
  focusMinutes = 25
): number =>
  getBlocksForDate(blocks, dateKey)
    // Task-linked blocks are already counted via the task estimate below;
    // counting both double-counts the same planned work.
    .filter((block) => block.kind === "focus" && !block.taskId)
    .reduce(
      (sum, block) => sum + pomodorosFromMinutes(block.durationMinutes, focusMinutes),
      0
    );

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
  dateKey: string,
  focusMinutes = 25
): number =>
  getPlannedTaskPomodoros(tasks, dateKey) +
  getScheduledPomodoros(blocks, dateKey, focusMinutes);

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

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const monthLabel = (year: number, month: number): string =>
  `${MONTH_NAMES[Math.max(0, Math.min(11, month))]} ${year}`;

/** Sunday-first grid cells for a month: dateKeys with null leading blanks. */
export const getMonthCells = (year: number, month: number): (string | null)[] => {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < first.getDay(); i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toDateKey(new Date(year, month, day).getTime()));
  }
  return cells;
};

export const addMonths = (
  year: number,
  month: number,
  delta: number
): { year: number; month: number } => {
  const total = year * 12 + month + delta;
  const nextYear = Math.floor(total / 12);
  const nextMonth = ((total % 12) + 12) % 12;
  return { year: nextYear, month: nextMonth };
};

export const yearMonthOf = (dateKey: string): { year: number; month: number } => {
  const date = new Date(`${dateKey}T00:00:00`);
  return { year: date.getFullYear(), month: date.getMonth() };
};

/** Scheduled-block counts per day for a month (agenda dots). */
export const countBlocksByDate = (
  blocks: ScheduleBlock[],
  year: number,
  month: number
): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const block of blocks) {
    const parsed = yearMonthOf(block.dateKey);
    if (parsed.year === year && parsed.month === month) {
      counts[block.dateKey] = (counts[block.dateKey] ?? 0) + 1;
    }
  }
  return counts;
};
