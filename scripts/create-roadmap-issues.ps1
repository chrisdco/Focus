# Creates GitHub milestones and issues for Foco product roadmap
$repo = "ChrisDc777/Focus"

function New-Milestone {
    param([string]$Title, [string]$Description)
    $body = @{ title = $Title; description = $Description; state = "open" } | ConvertTo-Json
    $result = gh api "repos/$repo/milestones" --method POST --input - <<< $body 2>$null
    if (-not $result) {
        # PowerShell doesn't support <<< ; use echo pipe
        $result = $body | gh api "repos/$repo/milestones" --method POST --input -
    }
    return ($result | ConvertFrom-Json)
}

function New-Issue {
    param([string]$Title, [string]$Body, [int]$Milestone, [string[]]$Labels = @())
    $args = @(
        "issue", "create",
        "--repo", $repo,
        "--title", $Title,
        "--body", $Body,
        "--milestone", $Milestone.ToString()
    )
    foreach ($label in $Labels) {
        $args += @("--label", $label)
    }
    & gh @args
}

# --- Milestones ---
$milestones = @(
    @{
        Title = "M1: Core Timer Completion"
        Description = "Ship a complete, polished Pomodoro engine. Fill gaps in auto-start, skip, sounds, immersive focus mode, and theme wiring."
    },
    @{
        Title = "M2: Tasks & Projects"
        Description = "Level 2 foundation: task management integrated with the timer. Users choose what they work on and track Pomodoro progress per task."
    },
    @{
        Title = "M3: Analytics & Goals"
        Description = "Expand statistics into a real productivity dashboard. Daily/weekly goals, heatmaps, session history, and project breakdowns."
    },
    @{
        Title = "M4: Focus Environment"
        Description = "Differentiated focus experience: ambient soundscapes, mixer, and minimal distraction mode during active sessions."
    },
    @{
        Title = "M5: Personalization & Polish"
        Description = "Make Foco feel personal: theme system, accent colors, custom sounds, layout variants, and UX refinement pass."
    },
    @{
        Title = "M6: Calendar & Planning"
        Description = "Move from reactive timer to proactive planning: schedule focus blocks, plan tomorrow, calendar integration."
    },
    @{
        Title = "M7: Cloud Sync & Accounts"
        Description = "Cross-device productivity: authentication, cloud sync, export, backup/restore."
    },
    @{
        Title = "M8: Distraction Blocking"
        Description = "Advanced focus protection: DND integration, distraction logging, platform-aware blocking during sessions."
    },
    @{
        Title = "M9: Social & Collaboration"
        Description = "Optional social layer: shared focus rooms, accountability partners, team focus goals."
    },
    @{
        Title = "M10: AI Productivity Layer"
        Description = "Modern AI features: task breakdown, focus planning, productivity insights, weekly summaries."
    }
)

$milestoneNumbers = @{}

foreach ($m in $milestones) {
    $json = (@{ title = $m.Title; description = $m.Description; state = "open" } | ConvertTo-Json -Compress)
    $result = $json | gh api "repos/$repo/milestones" --method POST --input - | ConvertFrom-Json
    $milestoneNumbers[$m.Title] = $result.number
    Write-Host "Created milestone #$($result.number): $($m.Title)"
}

# --- Issues ---

$issues = @(
    # M1
    @{
        Milestone = "M1: Core Timer Completion"
        Title = "Add auto-start next session setting and behavior"
        Body = @"
## Context
Timer auto-cycles modes on completion but requires manual Start. Users expect seamless Pomodoro flow.

## Scope
- Add `autoStartNextSession` to Settings (default: off)
- On `COMPLETE_SESSION`, if enabled, dispatch START for the next mode automatically
- Respect haptics/sound on auto-start
- Persist setting in AsyncStorage

## Acceptance
- [ ] Toggle in Settings screen
- [ ] Focus completes → short break auto-starts when enabled
- [ ] Break completes → focus auto-starts when enabled
- [ ] Pause still works normally after auto-start

## Files
- `types/settings.ts`, `context/TimerContext.tsx`, `hooks/useTimerPersistence.ts`, `app/(tabs)/settings.tsx`
"@
        Labels = @("core", "pomodoro")
    },
    @{
        Milestone = "M1: Core Timer Completion"
        Title = "Expose skip session and skip break controls"
        Body = @"
## Context
`SWITCH_MODE` reducer action exists but has no UI. Users need to skip breaks or advance early.

## Scope
- Wire `skip()` in `usePomodoroTimer` to dispatch `SWITCH_MODE`
- Add Skip button visible during breaks; optional skip during focus with confirmation
- Cancel scheduled notification on skip
- Reset remaining time to next mode duration

## Acceptance
- [ ] Skip break advances to next focus session
- [ ] Skip focus (with confirm) advances to break
- [ ] Session counter updates correctly on skip

## Files
- `hooks/usePomodoroTimer.ts`, `app/(tabs)/index.tsx`, `context/TimerContext.tsx`
"@
        Labels = @("core", "pomodoro")
    },
    @{
        Milestone = "M1: Core Timer Completion"
        Title = "Add in-app session completion sound"
        Body = @"
## Context
`soundEnabled` only gates notification sound. Users expect audible feedback on session complete while app is open.

## Scope
- Add `expo-av` for local audio playback
- Bundle 2-3 subtle completion sounds (focus complete, break complete)
- Play on `justCompleted` when `soundEnabled` and app is foreground
- Do not duplicate notification sound when backgrounded

## Acceptance
- [ ] Sound plays on foreground completion
- [ ] Respects sound toggle in settings
- [ ] No crash if audio fails to load

## Files
- `hooks/useSessionSound.ts` (new), `app/(tabs)/index.tsx`, `types/settings.ts`
"@
        Labels = @("core", "audio")
    },
    @{
        Milestone = "M1: Core Timer Completion"
        Title = "Build immersive full-screen focus mode"
        Body = @"
## Context
During focus sessions, the UI should minimize distraction and maximize timer presence.

## Scope
- Toggle focus mode automatically when focus session starts (optional setting)
- Hide tab bar, shrink chrome, enlarge timer
- Show only: timer ring, current task placeholder, pause, time remaining
- Exit focus mode on pause or session complete
- Smooth enter/exit animation (Reanimated)

## Acceptance
- [ ] Tab bar hidden during active focus
- [ ] Timer scales up ~20%
- [ ] Setting to disable auto-enter focus mode
- [ ] Accessible exit path (pause button always visible)

## Files
- `app/(tabs)/index.tsx`, `app/(tabs)/_layout.tsx`, `components/focus/FocusModeLayout.tsx` (new)
"@
        Labels = @("core", "ux")
    },
    @{
        Milestone = "M1: Core Timer Completion"
        Title = "Wire dark/light theme from settings toggle"
        Body = @"
## Context
`darkMode` is stored in settings but UI uses hardcoded dark palette everywhere.

## Scope
- Create `ThemeProvider` reading from SettingsContext
- Define light and dark token sets in `theme/colors.ts`
- Replace hardcoded colors in timer, stats, settings screens
- Support system appearance as third option (extend Settings type)

## Acceptance
- [ ] Light mode renders correctly on all 3 tabs
- [ ] Toggle in settings applies immediately without restart
- [ ] Status bar style adapts to theme

## Files
- `theme/colors.ts`, `context/ThemeContext.tsx` (new), all screen files
"@
        Labels = @("personalization", "ux")
    },

    # M2
    @{
        Milestone = "M2: Tasks & Projects"
        Title = "Define task and project data model with local persistence"
        Body = @"
## Context
Foundation for Level 2 product. Timer must know *what* the user is working on.

## Scope
- Types: `Task`, `Project`, `TaskPriority`, `TaskStatus`
- Fields: title, notes, projectId, estimatedPomodoros, completedPomodoros, priority, dueDate, tags, isRecurring, createdAt, completedAt
- AsyncStorage keys and CRUD helpers in `storage/tasks.ts`
- `TasksContext` with reducer

## Acceptance
- [ ] Create/read/update/delete tasks locally
- [ ] Create/read/update/delete projects locally
- [ ] Data survives app restart

## Files
- `types/task.ts`, `storage/tasks.ts`, `context/TasksContext.tsx`
"@
        Labels = @("tasks", "foundation")
    },
    @{
        Milestone = "M2: Tasks & Projects"
        Title = "Build Tasks screen with inbox, today, and completed views"
        Body = @"
## Context
Primary task management UI. Users need to see and organize work before starting a timer.

## Scope
- New tab or stack screen: Tasks
- Segments: Inbox | Today | Completed
- Task list item: title, pomodoro progress (2/4), priority indicator, due date
- Empty states with helpful copy
- Pull-to-refresh (local)

## Acceptance
- [ ] Three views filter tasks correctly
- [ ] Today shows tasks due today + manually pinned
- [ ] Completed shows done tasks with completion date

## Files
- `app/(tabs)/tasks.tsx` (new), `components/tasks/TaskList.tsx`, `components/tasks/TaskRow.tsx`
"@
        Labels = @("tasks", "ui")
    },
    @{
        Milestone = "M2: Tasks & Projects"
        Title = "Task create/edit form with priority, due date, tags, and notes"
        Body = @"
## Context
Users need rich task metadata to make Pomodoro tracking meaningful.

## Scope
- Modal or screen for create/edit task
- Fields: title (required), notes, estimated pomodoros, priority (low/med/high), due date picker, tag chips, project selector
- Validation: title required, estimated >= 1
- Edit and delete actions

## Acceptance
- [ ] Create task with all fields
- [ ] Edit existing task
- [ ] Delete with confirmation

## Files
- `components/tasks/TaskForm.tsx`, `app/tasks/[id].tsx` or modal
"@
        Labels = @("tasks", "ui")
    },
    @{
        Milestone = "M2: Tasks & Projects"
        Title = "Projects/folders for organizing tasks"
        Body = @"
## Context
Tasks need hierarchy. Projects group related work.

## Scope
- Project CRUD: name, color, icon (optional), sort order
- Project list view accessible from Tasks tab
- Filter tasks by project
- Default Inbox project for unassigned tasks

## Acceptance
- [ ] Create/edit/delete projects
- [ ] Assign task to project on create/edit
- [ ] Filter task list by project

## Files
- `components/tasks/ProjectList.tsx`, `app/projects/index.tsx`
"@
        Labels = @("tasks")
    },
    @{
        Milestone = "M2: Tasks & Projects"
        Title = "Link timer to active task and track Pomodoro progress"
        Body = @"
## Context
Core integration: completing a focus session increments the active task's completed pomodoros.

## Scope
- Select active task before/during focus (picker on timer screen)
- Store `activeTaskId` in timer state or context
- On focus session complete: increment `completedPomodoros`, log session with taskId
- Show active task name on timer screen
- Auto-mark task complete when estimated pomodoros reached (with prompt)

## Acceptance
- [ ] Timer shows current task name
- [ ] Completed focus session increments task counter
- [ ] Stats/logs include taskId reference
- [ ] Start timer directly from task row

## Files
- `context/TimerContext.tsx`, `context/TasksContext.tsx`, `app/(tabs)/index.tsx`, `types/stats.ts`
"@
        Labels = @("tasks", "core", "integration")
    },

    # M3
    @{
        Milestone = "M3: Analytics & Goals"
        Title = "Daily Pomodoro goal with home screen progress"
        Body = @"
## Context
Give users a reason to come back daily. Home screen should show progress toward today's target.

## Scope
- Add `dailyPomodoroGoal` to Settings (default: 8)
- Home screen widget: "3/8 Pomodoros today" with progress bar
- Count only completed focus sessions for current calendar day
- Subtle celebration when daily goal hit

## Acceptance
- [ ] Goal configurable in settings
- [ ] Home shows accurate today count
- [ ] Progress bar animates on increment

## Files
- `types/settings.ts`, `app/(tabs)/index.tsx`, `context/StatsContext.tsx`
"@
        Labels = @("goals", "analytics")
    },
    @{
        Milestone = "M3: Analytics & Goals"
        Title = "Weekly and monthly focus time totals"
        Body = @"
## Context
Stats screen currently shows 7-day chart only. Users need broader time horizons.

## Scope
- Period selector: Day | Week | Month on stats screen
- Aggregate focus minutes and pomodoro count per period
- Show comparison vs previous period (+12% vs last week)
- Reuse existing SessionLog data

## Acceptance
- [ ] Week view shows daily breakdown
- [ ] Month view shows weekly aggregates or calendar grid
- [ ] Totals match sum of session logs

## Files
- `app/(tabs)/stats.tsx`, `context/StatsContext.tsx`, `domain/statsCalculator.ts`
"@
        Labels = @("analytics")
    },
    @{
        Milestone = "M3: Analytics & Goals"
        Title = "Calendar heatmap for focus activity"
        Body = @"
## Context
GitHub-style heatmap is a hallmark of polished productivity apps.

## Scope
- 12-week or 6-month heatmap grid on stats screen
- Color intensity based on focus minutes per day
- Tap cell to see day detail (pomodoros, focus time)
- Use existing `focusMinutesByDay` derivation

## Acceptance
- [ ] Heatmap renders for last 12 weeks
- [ ] Colors scale correctly (0 = empty, max = darkest)
- [ ] Tap shows day summary tooltip/modal

## Files
- `components/stats/FocusHeatmap.tsx`, `app/(tabs)/stats.tsx`
"@
        Labels = @("analytics", "ui")
    },
    @{
        Milestone = "M3: Analytics & Goals"
        Title = "Session history timeline and personal records"
        Body = @"
## Context
Users want to see individual sessions and personal bests.

## Scope
- Scrollable session timeline (last 30 days)
- Each entry: time, duration, mode, linked task name
- Personal records card: longest focus session, best day, best week
- Average session length stat

## Acceptance
- [ ] Timeline lists sessions newest first
- [ ] Records computed correctly from logs
- [ ] Tap session for detail view

## Files
- `components/stats/SessionTimeline.tsx`, `domain/statsCalculator.ts`
"@
        Labels = @("analytics")
    },
    @{
        Milestone = "M3: Analytics & Goals"
        Title = "Focus time breakdown by project and productivity patterns"
        Body = @"
## Context
Analytics become actionable when tied to projects and time-of-day patterns.

## Scope
- Bar chart: focus time by project (requires M2 task linking)
- Productivity by hour-of-day histogram (when do you focus most?)
- Productivity by day-of-week chart
- Requires session logs with taskId and timestamps

## Acceptance
- [ ] Project breakdown shows top 5 projects
- [ ] Hour-of-day chart shows peak focus windows
- [ ] Empty state when no task-linked sessions

## Files
- `components/stats/ProjectBreakdown.tsx`, `components/stats/ProductivityChart.tsx`
"@
        Labels = @("analytics", "tasks")
    },
    @{
        Milestone = "M3: Analytics & Goals"
        Title = "Achievements, milestones, and streak badges"
        Body = @"
## Context
Subtle gamification to reinforce habit formation without being cheesy.

## Scope
- Define achievement types: first pomodoro, 7-day streak, 100 sessions, etc.
- Badge grid on stats or dedicated section
- Unlock animation on achievement (reuse CelebrationOverlay pattern)
- Persist unlocked achievements locally

## Acceptance
- [ ] At least 8 achievements defined
- [ ] Unlock triggers on qualifying event
- [ ] Badges persist across restarts

## Files
- `types/achievements.ts`, `data/achievements.ts`, `context/AchievementsContext.tsx`
"@
        Labels = @("goals", "motivation")
    },

    # M4
    @{
        Milestone = "M4: Focus Environment"
        Title = "Ambient sound library with expo-av playback"
        Body = @"
## Context
Key differentiator. Focus environment sets Foco apart from basic timers.

## Scope
- Bundle 5 ambient tracks: rain, café, forest, fireplace, white noise
- `SoundscapeContext` managing playback state
- Play/pause/stop controls
- Loop seamlessly; handle app background (pause or continue based on setting)
- Respect silent mode / audio session category

## Acceptance
- [ ] Each sound plays and loops without gap
- [ ] Only one ambient bed active at a time (mixer comes next)
- [ ] Audio stops cleanly on unmount

## Files
- `context/SoundscapeContext.tsx`, `assets/sounds/`, `hooks/useAmbientSound.ts`
"@
        Labels = @("focus-environment", "audio")
    },
    @{
        Milestone = "M4: Focus Environment"
        Title = "Focus Room sound mixer with per-track volume"
        Body = @"
## Context
Signature feature: combine ambient layers like "Rain 40% + Café 20% + White Noise 10%".

## Scope
- Mixer UI on Focus tab or overlay during session
- Up to 3 simultaneous tracks with individual volume sliders
- Preset combinations (Deep Focus, Coffee Shop, Nature)
- Save custom mix to settings
- Visual: `🌧️ Rain 40% + ☕ Café 20%`

## Acceptance
- [ ] Mix 2-3 sounds simultaneously
- [ ] Volume changes apply live
- [ ] Presets load correctly
- [ ] Mix persists across sessions

## Files
- `components/focus/SoundMixer.tsx`, `types/soundscape.ts`, `context/SoundscapeContext.tsx`
"@
        Labels = @("focus-environment", "differentiator")
    },
    @{
        Milestone = "M4: Focus Environment"
        Title = "Auto-start soundscape during focus sessions"
        Body = @"
## Context
Ambient sounds should activate with focus, not require manual setup each time.

## Scope
- Setting: auto-play last used mix on focus start
- Setting: auto-stop on break (or continue during breaks — user choice)
- Fade in/out transitions (500ms)
- Integrate with focus mode layout

## Acceptance
- [ ] Sounds fade in when focus starts (if enabled)
- [ ] Sounds fade out when focus ends
- [ ] Break behavior follows user preference

## Files
- `hooks/useFocusSoundscape.ts`, `types/settings.ts`
"@
        Labels = @("focus-environment", "integration")
    },
    @{
        Milestone = "M4: Focus Environment"
        Title = "Minimal distraction mode with subtle background animation"
        Body = @"
## Context
Visual calm during focus. Optional animated background that's non-distracting.

## Scope
- Subtle gradient or particle animation behind timer in focus mode
- Animation pauses when app backgrounds (performance)
- Toggle in settings: animations on/off
- Ensure 60fps on mid-range devices

## Acceptance
- [ ] Animation visible only in focus mode
- [ ] No measurable timer drift from animation
- [ ] Disabled via settings removes animation entirely

## Files
- `components/focus/FocusBackground.tsx`, `app/(tabs)/index.tsx`
"@
        Labels = @("focus-environment", "performance")
    },

    # M5
    @{
        Milestone = "M5: Personalization & Polish"
        Title = "Accent color picker and theme variants"
        Body = @"
## Context
Users should feel ownership over their timer aesthetic.

## Scope
- 6-8 preset accent colors beyond mode defaults
- Color applies to timer ring, buttons, tab bar active tint
- Preview in settings before applying
- Persist in settings

## Acceptance
- [ ] Accent color changes apply app-wide
- [ ] Mode colors (focus/break) still distinct from accent
- [ ] Persists across restart

## Files
- `theme/colors.ts`, `app/(tabs)/settings.tsx`, `context/ThemeContext.tsx`
"@
        Labels = @("personalization")
    },
    @{
        Milestone = "M5: Personalization & Polish"
        Title = "Custom completion and break sounds picker"
        Body = @"
## Context
Extend sound personalization beyond on/off toggle.

## Scope
- Sound picker UI in settings
- 3-5 completion sound options
- 2 break sound options
- Preview button in settings
- Persist selection

## Acceptance
- [ ] User can pick completion sound
- [ ] Preview plays without starting timer
- [ ] Selection used on session complete

## Files
- `app/(tabs)/settings.tsx`, `hooks/useSessionSound.ts`, `assets/sounds/`
"@
        Labels = @("personalization", "audio")
    },
    @{
        Milestone = "M5: Personalization & Polish"
        Title = "Timer layout variants: standard and minimal mode"
        Body = @"
## Context
Some users want bare-bones timer; others want rich context.

## Scope
- Minimal layout: timer ring + start/pause only
- Standard layout: current design with session counter, task, message
- Toggle in settings or quick-switch on timer screen
- Layout persists

## Acceptance
- [ ] Minimal mode hides session counter, personality message, task
- [ ] Switching layouts preserves timer state
- [ ] Both layouts support focus mode

## Files
- `components/timer/MinimalTimerLayout.tsx`, `app/(tabs)/index.tsx`
"@
        Labels = @("personalization", "ux")
    },
    @{
        Milestone = "M5: Personalization & Polish"
        Title = "UX polish pass: typography, spacing, empty states, and micro-interactions"
        Body = @"
## Context
Final polish before calling Level 2 complete. Consistency and delight in details.

## Scope
- Typography scale tokens (title, heading, body, caption)
- Spacing tokens applied consistently across all screens
- Empty states for stats, tasks, projects with illustrations or icons
- Haptic feedback audit (confirm every meaningful action has appropriate haptic)
- Loading/skeleton states for hydration
- Accessibility: labels, contrast ratios, font scaling

## Acceptance
- [ ] All screens use theme tokens (no magic numbers for colors)
- [ ] VoiceOver/TalkBack reads timer state correctly
- [ ] Empty states guide user to next action

## Files
- `theme/typography.ts`, `theme/spacing.ts`, all screens
"@
        Labels = @("polish", "accessibility")
    },

    # M6
    @{
        Milestone = "M6: Calendar & Planning"
        Title = "Day view calendar with scheduled focus blocks"
        Body = @"
## Context
Transition from reactive timer to proactive daily planning.

## Scope
- New Calendar tab with day view
- Time-blocked focus sessions and breaks displayed on timeline
- Drag to reschedule (stretch goal; tap-to-edit for v1)
- Visual distinction: focus blocks vs breaks vs external events

## Acceptance
- [ ] Day view shows scheduled blocks for today
- [ ] Blocks reflect actual timer durations from settings
- [ ] Empty day shows "Plan your focus" CTA

## Files
- `app/(tabs)/calendar.tsx`, `components/calendar/DayView.tsx`, `types/schedule.ts`
"@
        Labels = @("calendar")
    },
    @{
        Milestone = "M6: Calendar & Planning"
        Title = "Schedule focus sessions with local reminders"
        Body = @"
## Context
Users should be able to plan ahead and get nudged to start.

## Scope
- Create scheduled focus block: task, start time, duration
- Local notification 5 min before scheduled start
- Tap notification → open app with task pre-selected
- Persist schedule in AsyncStorage

## Acceptance
- [ ] Schedule a session for tomorrow 10:00 AM
- [ ] Reminder notification fires at 9:55 AM
- [ ] Tapping notification opens timer with task ready

## Files
- `context/ScheduleContext.tsx`, `hooks/useScheduleNotifications.ts`
"@
        Labels = @("calendar", "notifications")
    },
    @{
        Milestone = "M6: Calendar & Planning"
        Title = "Plan tomorrow quick action"
        Body = @"
## Context
Evening planning ritual drives next-day productivity.

## Scope
- "Plan Tomorrow" button on home or calendar
- Select tasks from inbox to schedule for next day
- Suggest time blocks based on available hours and daily goal
- Morning summary: "You have 6 pomodoros planned today"

## Acceptance
- [ ] Plan tomorrow flow schedules at least 1 task
- [ ] Next day home screen shows planned sessions count
- [ ] Unplanned days show gentle nudge

## Files
- `components/calendar/PlanTomorrow.tsx`, `app/(tabs)/calendar.tsx`
"@
        Labels = @("calendar", "planning")
    },

    # M7
    @{
        Milestone = "M7: Cloud Sync & Accounts"
        Title = "Authentication with email and OAuth"
        Body = @"
## Context
Foundation for cross-device sync. Choose backend (Supabase, Firebase, or custom).

## Scope
- Sign up / sign in / sign out screens
- Email + password auth
- Apple Sign In + Google Sign In (mobile)
- Secure token storage (expo-secure-store)
- Auth state in context; gate sync features

## Acceptance
- [ ] User can create account and sign in
- [ ] Session persists across app restart
- [ ] Sign out clears local sensitive data

## Files
- `context/AuthContext.tsx`, `app/(auth)/`, `lib/auth.ts`
"@
        Labels = @("sync", "backend")
    },
    @{
        Milestone = "M7: Cloud Sync & Accounts"
        Title = "Cloud sync for tasks, sessions, settings, and goals"
        Body = @"
## Context
Start a Pomodoro on phone, see it on web. Core cross-device value.

## Scope
- Sync engine: push local changes, pull remote changes
- Conflict resolution: last-write-wins for settings, merge for session logs
- Sync on app foreground and after session complete
- Offline-first: queue changes when offline, sync when connected
- Sync indicator in UI

## Acceptance
- [ ] Tasks sync across two devices
- [ ] Session logs sync and stats update on both
- [ ] Offline changes sync when back online

## Files
- `lib/sync/`, `hooks/useSyncEngine.ts`, `context/SyncContext.tsx`
"@
        Labels = @("sync", "backend")
    },
    @{
        Milestone = "M7: Cloud Sync & Accounts"
        Title = "Data export and backup/restore"
        Body = @"
## Context
Users own their data. Export and backup build trust.

## Scope
- Export all data as JSON (settings, tasks, projects, sessions, achievements)
- Export sessions as CSV for spreadsheet analysis
- Backup to file / share sheet
- Restore from backup file with confirmation
- Available in settings

## Acceptance
- [ ] Export JSON contains all user data
- [ ] CSV export opens in Excel/Sheets correctly
- [ ] Restore replaces local data after confirm

## Files
- `lib/export.ts`, `app/(tabs)/settings.tsx`
"@
        Labels = @("sync", "data")
    },

    # M8
    @{
        Milestone = "M8: Distraction Blocking"
        Title = "Do Not Disturb integration during focus sessions"
        Body = @"
## Context
Platform-native focus protection without building a blocker from scratch.

## Scope
- Request DND permission (Android DND access, iOS Focus Filters if available)
- Enable DND on focus start, restore previous state on end
- Setting: enable/disable DND integration
- Show "Focus mode active" indicator with time remaining

## Acceptance
- [ ] DND activates on focus start (when permitted)
- [ ] DND restores on session end
- [ ] Graceful fallback when permission denied

## Files
- `hooks/useFocusDnd.ts`, `lib/dnd/` (platform-specific)
"@
        Labels = @("blocking", "platform")
    },
    @{
        Milestone = "M8: Distraction Blocking"
        Title = "Distraction log during focus sessions"
        Body = @"
## Context
Track when users leave the app during focus — awareness drives behavior change.

## Scope
- Log app background events during active focus sessions
- Distraction log: timestamp, duration away, session context
- Summary on stats screen: "You left the app 3 times during focus today"
- No judgment UX — informational tone

## Acceptance
- [ ] Background during focus logged with duration
- [ ] Stats show daily distraction count
- [ ] Log persists locally

## Files
- `hooks/useDistractionLog.ts`, `types/distraction.ts`, `app/(tabs)/stats.tsx`
"@
        Labels = @("blocking", "analytics")
    },

    # M9
    @{
        Milestone = "M9: Social & Collaboration"
        Title = "Shared focus rooms with live participant count"
        Body = @"
## Context
Optional social layer. Study/work alongside others for accountability.

## Scope
- Create or join a focus room (requires M7 auth)
- Room shows participant count and anonymized pomodoro counts
- Real-time updates via WebSocket or Firebase
- Leave room on session end or manual exit

## Acceptance
- [ ] Create room and share invite link/code
- [ ] See other participants' pomodoro counts update live
- [ ] Room dissolves or persists based on design choice

## Files
- `context/FocusRoomContext.tsx`, `app/focus-room/`, backend room service
"@
        Labels = @("social", "backend")
    },

    # M10
    @{
        Milestone = "M10: AI Productivity Layer"
        Title = "AI task breakdown into Pomodoro estimates"
        Body = @"
## Context
Modern differentiator. Turn vague goals into actionable Pomodoro plans.

## Scope
- Input: task description or goal text
- Output: subtasks with pomodoro estimates
- Use LLM API (OpenAI/Anthropic) via secure backend proxy
- User can edit/adjust before saving as tasks
- Rate limit and error handling

## Acceptance
- [ ] "Study for exam tomorrow" → 4-6 subtasks with estimates
- [ ] User can accept/modify/reject suggestions
- [ ] Creates tasks in local store on accept

## Files
- `lib/ai/taskBreakdown.ts`, `components/ai/TaskBreakdownSheet.tsx`, backend proxy
"@
        Labels = @("ai")
    },
    @{
        Milestone = "M10: AI Productivity Layer"
        Title = "AI daily focus plan and weekly productivity summary"
        Body = @"
## Context
Proactive AI coach based on user's tasks, history, and goals.

## Scope
- "Plan my day" generates ordered focus schedule from today's tasks + calendar
- Weekly summary: focus time, streak, patterns, encouragement
- "You focus best between 9-11 AM" insight from session data
- Overwork detection: warn if focus time exceeds healthy threshold

## Acceptance
- [ ] Daily plan suggests realistic pomodoro schedule
- [ ] Weekly summary generates from actual session data
- [ ] Insights reference real patterns (not generic)

## Files
- `lib/ai/focusPlan.ts`, `lib/ai/weeklySummary.ts`, `components/ai/`
"@
        Labels = @("ai", "analytics")
    }
)

# Create labels first
$labels = @("core", "pomodoro", "tasks", "analytics", "goals", "focus-environment", "personalization", "calendar", "sync", "blocking", "social", "ai", "ux", "ui", "audio", "backend", "platform", "polish", "accessibility", "motivation", "differentiator", "integration", "foundation", "performance", "planning", "notifications", "data")
foreach ($label in $labels) {
    gh label create $label --repo $repo --force 2>$null
}

foreach ($issue in $issues) {
    $mNum = $milestoneNumbers[$issue.Milestone]
    New-Issue -Title $issue.Title -Body $issue.Body -Milestone $mNum -Labels $issue.Labels
    Start-Sleep -Milliseconds 500
}

Write-Host "`nDone! Created $($milestones.Count) milestones and $($issues.Count) issues."
