import type { TimerMode } from "../types/timer";

export type PersonalityTrigger =
  | "start"
  | "mid"
  | "complete"
  | "breakStart";

export interface PersonalityMessage {
  id: string;
  mode: TimerMode | "any";
  trigger: PersonalityTrigger;
  text: string;
}

export const personalityMessages: PersonalityMessage[] = [
  {
    id: "focus-start-1",
    mode: "focus",
    trigger: "start",
    text: "Deep work mode activated. You've got this.",
  },
  {
    id: "focus-start-2",
    mode: "focus",
    trigger: "start",
    text: "One session at a time. Let's focus.",
  },
  {
    id: "focus-mid-1",
    mode: "focus",
    trigger: "mid",
    text: "Halfway there — stay in the zone.",
  },
  {
    id: "focus-mid-2",
    mode: "focus",
    trigger: "mid",
    text: "You're doing great. Keep going.",
  },
  {
    id: "focus-complete-1",
    mode: "focus",
    trigger: "complete",
    text: "Session complete! Time for a well-earned break.",
  },
  {
    id: "focus-complete-2",
    mode: "focus",
    trigger: "complete",
    text: "Excellent focus. Celebrate the win!",
  },
  {
    id: "short-start-1",
    mode: "shortBreak",
    trigger: "start",
    text: "Stretch, breathe, recharge.",
  },
  {
    id: "short-start-2",
    mode: "shortBreak",
    trigger: "breakStart",
    text: "Short break — rest your eyes.",
  },
  {
    id: "long-start-1",
    mode: "longBreak",
    trigger: "start",
    text: "Long break earned. Step away and reset.",
  },
  {
    id: "long-start-2",
    mode: "longBreak",
    trigger: "breakStart",
    text: "Four sessions down. Enjoy the long break.",
  },
  {
    id: "break-complete-1",
    mode: "shortBreak",
    trigger: "complete",
    text: "Break over — ready for another round?",
  },
  {
    id: "break-complete-2",
    mode: "longBreak",
    trigger: "complete",
    text: "Refreshed and ready. Let's go!",
  },
];

export const pickMessage = (
  mode: TimerMode,
  trigger: PersonalityTrigger
): string => {
  const candidates = personalityMessages.filter(
    (message) =>
      message.trigger === trigger &&
      (message.mode === mode || message.mode === "any")
  );

  if (candidates.length === 0) {
    return "";
  }

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index].text;
};
