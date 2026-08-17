#!/usr/bin/env node
const { spawnSync } = require("child_process");

const REPO = "chrisdco/Focus";

function run(args, input) {
  const proc = spawnSync("gh", args, { input, encoding: "utf-8" });
  if (proc.status !== 0) throw new Error(proc.stderr || proc.stdout);
  return proc.stdout.trim();
}

const milestones = [
  ["M1: Core Timer Completion", "Ship a complete, polished Pomodoro engine. Fill gaps in auto-start, skip, sounds, immersive focus mode, and theme wiring."],
  ["M2: Tasks & Projects", "Level 2 foundation: task management integrated with the timer. Users choose what they work on and track Pomodoro progress per task."],
  ["M3: Analytics & Goals", "Expand statistics into a real productivity dashboard. Daily/weekly goals, heatmaps, session history, and project breakdowns."],
  ["M4: Focus Environment", "Differentiated focus experience: ambient soundscapes, mixer, and minimal distraction mode during active sessions."],
  ["M5: Personalization & Polish", "Make Foco feel personal: theme system, accent colors, custom sounds, layout variants, and UX refinement pass."],
  ["M6: Calendar & Planning", "Move from reactive timer to proactive planning: schedule focus blocks, plan tomorrow, calendar integration."],
  ["M7: Cloud Sync & Accounts", "Cross-device productivity: authentication, cloud sync, export, backup/restore."],
  ["M8: Distraction Blocking", "Advanced focus protection: DND integration, distraction logging, platform-aware blocking during sessions."],
  ["M9: Social & Collaboration", "Optional social layer: shared focus rooms, accountability partners, team focus goals."],
  ["M10: AI Productivity Layer", "Modern AI features: task breakdown, focus planning, productivity insights, weekly summaries."],
];

const milestoneMap = {};
for (const [title] of milestones) {
  milestoneMap[title] = title;
  console.log(`Using milestone: ${title}`);
}

const labels = ["core","pomodoro","tasks","analytics","goals","focus-environment","personalization","calendar","sync","blocking","social","ai","ux","ui","audio","backend","platform","polish","accessibility","motivation","differentiator","integration","foundation","performance","planning","notifications","data"];
for (const label of labels) {
  spawnSync("gh", ["label", "create", label, "--repo", REPO, "--force"], { encoding: "utf-8" });
}

const issues = [
  { m:"M1: Core Timer Completion", title:"Add auto-start next session setting and behavior", labels:["core","pomodoro"], body:"## Context\nTimer auto-cycles modes on completion but requires manual Start.\n\n## Scope\n- Add `autoStartNextSession` to Settings\n- On COMPLETE_SESSION, auto-dispatch START for next mode when enabled\n- Persist in AsyncStorage\n\n## Acceptance\n- [ ] Toggle in Settings\n- [ ] Focus completes → break auto-starts when enabled\n- [ ] Break completes → focus auto-starts when enabled\n- [ ] Pause still works after auto-start" },
  { m:"M1: Core Timer Completion", title:"Expose skip session and skip break controls", labels:["core","pomodoro"], body:"## Context\n`SWITCH_MODE` reducer action exists but has no UI.\n\n## Scope\n- Wire `skip()` in usePomodoroTimer\n- Skip button during breaks; skip focus with confirmation\n- Cancel notification on skip\n\n## Acceptance\n- [ ] Skip break advances to next focus\n- [ ] Skip focus (with confirm) advances to break\n- [ ] Session counter updates correctly" },
  { m:"M1: Core Timer Completion", title:"Add in-app session completion sound", labels:["core","audio"], body:"## Context\n`soundEnabled` only gates notification sound.\n\n## Scope\n- Add expo-av for local audio playback\n- Play on justCompleted when app is foreground\n- Respect sound toggle\n\n## Acceptance\n- [ ] Sound plays on foreground completion\n- [ ] No duplicate with notification when backgrounded" },
  { m:"M1: Core Timer Completion", title:"Build immersive full-screen focus mode", labels:["core","ux"], body:"## Context\nMinimize distraction during active focus sessions.\n\n## Scope\n- Hide tab bar during focus\n- Enlarge timer; show only pause + time remaining\n- Reanimated enter/exit animation\n- Optional auto-enter setting\n\n## Acceptance\n- [ ] Tab bar hidden during active focus\n- [ ] Timer scales up\n- [ ] Pause button always accessible" },
  { m:"M1: Core Timer Completion", title:"Wire dark/light theme from settings toggle", labels:["personalization","ux"], body:"## Context\n`darkMode` is stored but UI uses hardcoded dark palette.\n\n## Scope\n- ThemeProvider reading from SettingsContext\n- Light + dark token sets in theme/colors.ts\n- Replace hardcoded colors on all 3 tabs\n\n## Acceptance\n- [ ] Light mode renders on all tabs\n- [ ] Toggle applies immediately without restart" },
  { m:"M2: Tasks & Projects", title:"Define task and project data model with local persistence", labels:["tasks","foundation"], body:"## Scope\n- Types: Task, Project, TaskPriority, TaskStatus\n- Fields: title, notes, projectId, estimatedPomodoros, completedPomodoros, priority, dueDate, tags, isRecurring\n- AsyncStorage CRUD + TasksContext\n\n## Acceptance\n- [ ] CRUD tasks and projects locally\n- [ ] Data survives app restart" },
  { m:"M2: Tasks & Projects", title:"Build Tasks screen with inbox, today, and completed views", labels:["tasks","ui"], body:"## Scope\n- New Tasks tab\n- Segments: Inbox | Today | Completed\n- Task row: title, pomodoro progress (2/4), priority, due date\n\n## Acceptance\n- [ ] Three views filter correctly\n- [ ] Empty states with helpful copy" },
  { m:"M2: Tasks & Projects", title:"Task create/edit form with priority, due date, tags, and notes", labels:["tasks","ui"], body:"## Scope\n- Create/edit modal or screen\n- All metadata fields with validation\n- Delete with confirmation\n\n## Acceptance\n- [ ] Full CRUD with all fields" },
  { m:"M2: Tasks & Projects", title:"Projects/folders for organizing tasks", labels:["tasks"], body:"## Scope\n- Project CRUD: name, color, sort order\n- Filter tasks by project\n- Default Inbox for unassigned tasks\n\n## Acceptance\n- [ ] Assign task to project\n- [ ] Filter by project works" },
  { m:"M2: Tasks & Projects", title:"Link timer to active task and track Pomodoro progress", labels:["tasks","core","integration"], body:"## Scope\n- Select active task on timer screen\n- Increment completedPomodoros on focus complete\n- Show task name on timer; start timer from task row\n- Auto-complete prompt when estimate reached\n\n## Acceptance\n- [ ] Session increments task counter\n- [ ] Stats/logs include taskId" },
  { m:"M3: Analytics & Goals", title:"Daily Pomodoro goal with home screen progress", labels:["goals","analytics"], body:"## Scope\n- `dailyPomodoroGoal` in Settings (default: 8)\n- Home widget: 3/8 Pomodoros with progress bar\n- Subtle celebration when goal hit\n\n## Acceptance\n- [ ] Configurable goal\n- [ ] Accurate today count" },
  { m:"M3: Analytics & Goals", title:"Weekly and monthly focus time totals", labels:["analytics"], body:"## Scope\n- Period selector: Day | Week | Month\n- Comparison vs previous period (+12% vs last week)\n- Reuse SessionLog data\n\n## Acceptance\n- [ ] All periods aggregate correctly" },
  { m:"M3: Analytics & Goals", title:"Calendar heatmap for focus activity", labels:["analytics","ui"], body:"## Scope\n- 12-week GitHub-style heatmap on stats screen\n- Tap cell for day detail\n- Color intensity by focus minutes\n\n## Acceptance\n- [ ] Heatmap renders correctly\n- [ ] Tap shows day summary" },
  { m:"M3: Analytics & Goals", title:"Session history timeline and personal records", labels:["analytics"], body:"## Scope\n- Scrollable session timeline (last 30 days)\n- Records: longest session, best day/week, average length\n\n## Acceptance\n- [ ] Timeline newest first\n- [ ] Records computed from logs" },
  { m:"M3: Analytics & Goals", title:"Focus time breakdown by project and productivity patterns", labels:["analytics","tasks"], body:"## Scope\n- Focus time by project bar chart\n- Productivity by hour-of-day and day-of-week\n- Requires task-linked sessions (M2)\n\n## Acceptance\n- [ ] Top 5 projects shown\n- [ ] Peak focus windows visible" },
  { m:"M3: Analytics & Goals", title:"Achievements, milestones, and streak badges", labels:["goals","motivation"], body:"## Scope\n- 8+ achievements (first pomodoro, 7-day streak, 100 sessions)\n- Badge grid with unlock animation\n- Persist locally\n\n## Acceptance\n- [ ] Unlock on qualifying event\n- [ ] Persists across restart" },
  { m:"M4: Focus Environment", title:"Ambient sound library with expo-av playback", labels:["focus-environment","audio"], body:"## Scope\n- 5 tracks: rain, café, forest, fireplace, white noise\n- SoundscapeContext with seamless loop\n- Handle background audio policy\n\n## Acceptance\n- [ ] Each sound loops without gap\n- [ ] Clean stop on unmount" },
  { m:"M4: Focus Environment", title:"Focus Room sound mixer with per-track volume", labels:["focus-environment","differentiator"], body:"## Scope\n- Mix up to 3 tracks with volume sliders\n- Presets: Deep Focus, Coffee Shop, Nature\n- Save custom mix to settings\n\n## Acceptance\n- [ ] Live volume control\n- [ ] Mix persists across sessions" },
  { m:"M4: Focus Environment", title:"Auto-start soundscape during focus sessions", labels:["focus-environment","integration"], body:"## Scope\n- Auto-play last mix on focus start\n- 500ms fade in/out\n- Break behavior setting (stop vs continue)\n\n## Acceptance\n- [ ] Fade in on focus start\n- [ ] Fade out on focus end" },
  { m:"M4: Focus Environment", title:"Minimal distraction mode with subtle background animation", labels:["focus-environment","performance"], body:"## Scope\n- Subtle gradient animation in focus mode\n- Pause when app backgrounds\n- 60fps target; toggle in settings\n\n## Acceptance\n- [ ] No timer drift from animation\n- [ ] Disabled via settings" },
  { m:"M5: Personalization & Polish", title:"Accent color picker and theme variants", labels:["personalization"], body:"## Scope\n- 6-8 accent color presets\n- Apply to ring, buttons, tab bar active tint\n- Preview in settings\n\n## Acceptance\n- [ ] Persists across restart" },
  { m:"M5: Personalization & Polish", title:"Custom completion and break sounds picker", labels:["personalization","audio"], body:"## Scope\n- 3-5 completion sounds, 2 break sounds\n- Preview button in settings\n\n## Acceptance\n- [ ] Selection used on session complete" },
  { m:"M5: Personalization & Polish", title:"Timer layout variants: standard and minimal mode", labels:["personalization","ux"], body:"## Scope\n- Minimal: ring + start/pause only\n- Standard: current rich layout\n- Toggle in settings\n\n## Acceptance\n- [ ] Both layouts preserve timer state" },
  { m:"M5: Personalization & Polish", title:"UX polish pass: typography, spacing, empty states, and micro-interactions", labels:["polish","accessibility"], body:"## Scope\n- Typography and spacing tokens\n- Empty states on all screens\n- Accessibility audit (VoiceOver, contrast)\n- Loading skeletons for hydration\n\n## Acceptance\n- [ ] VoiceOver reads timer state\n- [ ] No hardcoded color values in screens" },
  { m:"M6: Calendar & Planning", title:"Day view calendar with scheduled focus blocks", labels:["calendar"], body:"## Scope\n- Calendar tab with day timeline\n- Visualize focus blocks and breaks\n- Tap to edit scheduled block\n\n## Acceptance\n- [ ] Day view shows today's blocks" },
  { m:"M6: Calendar & Planning", title:"Schedule focus sessions with local reminders", labels:["calendar","notifications"], body:"## Scope\n- Schedule block: task, start time, duration\n- Local notification 5 min before\n- Tap notification opens pre-selected task\n\n## Acceptance\n- [ ] Reminder fires at correct time" },
  { m:"M6: Calendar & Planning", title:"Plan tomorrow quick action", labels:["calendar","planning"], body:"## Scope\n- Plan Tomorrow flow from calendar or home\n- Select inbox tasks for next day\n- Morning summary: planned pomodoro count\n\n## Acceptance\n- [ ] Next day home shows planned count" },
  { m:"M7: Cloud Sync & Accounts", title:"Authentication with email and OAuth", labels:["sync","backend"], body:"## Scope\n- Sign up/in/out screens\n- Email + Apple + Google auth\n- Secure token storage (expo-secure-store)\n\n## Acceptance\n- [ ] Session persists across restart" },
  { m:"M7: Cloud Sync & Accounts", title:"Cloud sync for tasks, sessions, settings, and goals", labels:["sync","backend"], body:"## Scope\n- Offline-first sync engine\n- Conflict resolution (last-write-wins settings, merge logs)\n- Sync on foreground + session complete\n\n## Acceptance\n- [ ] Tasks sync across 2 devices\n- [ ] Offline queue syncs when online" },
  { m:"M7: Cloud Sync & Accounts", title:"Data export and backup/restore", labels:["sync","data"], body:"## Scope\n- Export all data as JSON + sessions as CSV\n- Backup via share sheet\n- Restore with confirmation\n\n## Acceptance\n- [ ] CSV opens in spreadsheet apps" },
  { m:"M8: Distraction Blocking", title:"Do Not Disturb integration during focus sessions", labels:["blocking","platform"], body:"## Scope\n- Enable DND on focus start, restore on end\n- Platform-specific permission handling\n- Focus mode active indicator\n\n## Acceptance\n- [ ] Graceful fallback when permission denied" },
  { m:"M8: Distraction Blocking", title:"Distraction log during focus sessions", labels:["blocking","analytics"], body:"## Scope\n- Log app background events during focus\n- Daily distraction summary on stats\n- Informational, non-judgmental tone\n\n## Acceptance\n- [ ] Background events logged with duration" },
  { m:"M9: Social & Collaboration", title:"Shared focus rooms with live participant count", labels:["social","backend"], body:"## Scope\n- Create/join focus room (requires M7 auth)\n- Live participant pomodoro counts\n- Real-time via WebSocket\n\n## Acceptance\n- [ ] Invite link works\n- [ ] Counts update live" },
  { m:"M10: AI Productivity Layer", title:"AI task breakdown into Pomodoro estimates", labels:["ai"], body:"## Scope\n- Goal text → subtasks with pomodoro estimates\n- LLM via secure backend proxy\n- User edit/adjust before saving as tasks\n\n## Acceptance\n- [ ] Creates tasks on accept" },
  { m:"M10: AI Productivity Layer", title:"AI daily focus plan and weekly productivity summary", labels:["ai","analytics"], body:"## Scope\n- Plan my day from tasks + calendar\n- Weekly summary with real patterns\n- Overwork detection\n\n## Acceptance\n- [ ] Insights reference actual session data" },
];

for (const issue of issues) {
  const args = [
    "issue","create","--repo",REPO,
    "--title",issue.title,
    "--body",issue.body,
    "--milestone",issue.m,
    ...issue.labels.flatMap(l=>["--label",l]),
  ];
  const proc = spawnSync("gh", args, { encoding:"utf-8" });
  if (proc.status !== 0) console.error("Failed:", issue.title, proc.stderr);
  else console.log("Created:", issue.title);
}

console.log(`\nDone! ${Object.keys(milestoneMap).length} milestones, ${issues.length} issues on ${REPO}.`);
