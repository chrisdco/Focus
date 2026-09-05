# AGENTS.md — Foco working conventions

Expo Router + TypeScript Pomodoro app. Local-first; no backend yet.

## Commands (bun)

- `bun run start` — dev server (scan QR with Expo Go). One-time `bun run start --clear` after native dep changes only.
- `bun run test` — vitest suite (domain logic, reducer, helpers).
- `bun run lint` — `expo lint`.
- `bun run typecheck` — `tsc --noEmit`.
- CI runs all three on push/PR to main.

## Git + GitHub

- Feature/fix branches off `main`, one concern per PR, squash-merge via `gh`.
- Issues use `## Scope` + `## Acceptance` checkboxes and attach to milestones.
- Never commit secrets; `git status` clean before branching.

## Design system (the law)

- Tokens live in `theme/`: `type` roles (title, sheetTitle, eyebrow, section, body, caption, timer), `space` scale, palette + per-accent gradients.
- 20px screen insets, 16px section rhythm, 48px touch rows, hairline dividers between same-type rows.
- One gradient CTA per view (`GradientButton`); secondary actions stay quiet.
- Sheets: `@expo/ui` BottomSheet + RNHostView. Forms stay on native Modal.
- No emoji in UI. Tab titles match screen titles.
- Styling is hybrid NativeWind: layout/spacing/type in `className`, dynamic
  colors always via `useTheme()` (accents + own dark mode can't be static
  classes). Animated styles stay in StyleSheet.
- References: `docs/design-references.md` (Opal/Health specs + mapping). The 8-principle audit at its bottom must still hold after any visual change.

## Code rules

- Pure domain logic in `domain/` + `utils/` with vitest coverage; providers stay thin.
- Storage loaders validate shapes and fall back safely (`storage/index.ts`).
- Never statically import `expo-notifications` — use `utils/notifications.ts` facade (Expo Go Android strips the module).
- State updaters must be pure (no nested setState); completion paths dedupe by key.
- Respect `focusAnimationsEnabled` and OS reduced motion for all animation.
