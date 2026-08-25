# Foco

A Pomodoro focus app built with Expo Router and TypeScript. Timer, tasks, stats, and focus-environment audio share one session log and one settings store — later milestones extend the same loop rather than adding disconnected screens.

## How it fits together

Starting a focus session is the hub. Everything else hangs off that:

1. Choose an **active task** on the timer (M2).
2. Run the session. On complete, Foco logs the session (with `taskId` when set), increments the task’s pomodoro count, updates streaks/goals/achievements (M3), and can play a completion chime.
3. Stats charts (period totals, heatmap, project breakdown, timeline) read those same logs.
4. If ambient audio is on, the last mix fades in when focus starts and fades out when it ends (M4).

Settings (durations, daily goal, theme, soundscape mix, animation toggle) persist locally and apply across screens.

| Milestone | What shipped | Wired into |
|-----------|--------------|------------|
| **M1** Core timer | Modes, skip, auto-start, immersive focus, theme, completion sound | Timer tab, settings, notifications |
| **M2** Tasks & projects | Inbox / Today / Completed, projects, task form, active task | Timer → logs `taskId`; completing focus increments the task |
| **M3** Analytics & goals | Daily goal widget, period stats, heatmap, records, project breakdown, achievements | Stats from session logs; goal from settings |
| **M4** Focus environment | Ambient mixer, auto-play on focus, background animation | Timer + settings; pauses when the app backgrounds |

Still open on the roadmap: personalization (M5), calendar (M6), sync/export (M7), blocking (M8), social (M9), AI (M10).

## Stack

- Expo SDK 57, React Native 0.86, React 19.2
- Expo Router, Reanimated, `expo-audio`, `expo-notifications`, AsyncStorage

## Run

```bash
npm install
npx expo start
```

Then open Expo Go, an emulator, or a development build. Duration and mix changes apply to future / next playback, not the in-progress session.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Expo dev server |
| `npm run lint` | ESLint via `expo lint` |
| `npx expo-doctor` | SDK / dependency checks |
