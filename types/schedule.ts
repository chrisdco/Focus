export type ScheduleBlockKind = "focus" | "shortBreak" | "longBreak";

export interface ScheduleBlock {
  id: string;
  dateKey: string;
  startMinutes: number;
  durationMinutes: number;
  kind: ScheduleBlockKind;
  taskId: string | null;
}

export interface ScheduleBlockDraft {
  dateKey: string;
  startMinutes: number;
  durationMinutes: number;
  kind: ScheduleBlockKind;
  taskId: string | null;
}

export const REMINDER_LEAD_MINUTES = 5;

export const createEmptyBlockDraft = (
  dateKey: string,
  durationMinutes = 25
): ScheduleBlockDraft => ({
  dateKey,
  startMinutes: 9 * 60,
  durationMinutes,
  kind: "focus",
  taskId: null,
});
