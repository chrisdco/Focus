# Design references

Living spec distilled from reference screenshots. Every visual change should
cite the line it follows; deviations are named at the bottom.

Source images: user-shared screenshots (Opal session, Opal home, Apple Health
State of Mind calendar, Apple Health medications calendar).

## R1 — Opal session sheet (Image 2)

- Near-black background, one glowing hero object centered up top.
- Bottom sheet holds a grouped card: icon rows, label left, value + chevron
  right (`Duration 10m >`, `Apps Blocked / Block List >`, `Difficulty / Timeout >`).
- One quiet info row inside the card (blue ⓘ note about snooze delays).
- One full-width gradient CTA (`Start Session`, lime → teal).
- Handle bar, generous 20px+ insets, 16px+ radii.

Mapping: `SessionCard` rows + `GradientButton` CTA + `@expo/ui` sheet.

## R2 — Opal home (Image 3)

- Hero metric first: huge gradient number (`3h 37m`), small-caps gray label
  under it (`SCREEN TIME TODAY`, letterspaced).
- Stat trio in one row: `MOST USED / FOCUS SCORE 80% / PICKUPS 3`.
- Gradient bar chart with time axis (`9AM 1PM 5PM 9PM`), rounded bars.
- One summary row (`Time Offline 10h 38m`, sub `62% of your day`).
- One gradient CTA (`Block Now`), tabs: Home / Blocks / Profile.

Mapping: stats hero + trio pattern (`TodayStrip` counts, stats hero number
with eyebrow label), gradient bars in `BarChart`, tabs Timer/Calendar/Tasks/
Stats/Profile.

## R3 — Health State of Mind calendar (Image 1)

- Continuous month list; month name (`Sep`) sits inline above its grid.
- Weekday header single letters, gray, small.
- Day cells are circles: empty ring = no log, colored emblem = logged state.
- Selected day = filled gray circle; today marked.
- Months flow into each other (Sep → Oct) with no hard boundary.

Mapping: `MonthGrid` dots + filled-circle selection + accent today. We page
by month instead of infinite scroll (simpler, tested); revisit if needed.

## R4 — Health medications calendar (Image 4)

- Top bar: back chevron left, title center, X close right — always an
  explicit exit.
- Picker header: `September 2025 ›` tappable label flanked by `‹ ›`
  chevrons; tapping the label returns to the current period.
- Full weekday names (`SUN MON TUE …`), small caps gray.
- Selected day = filled teal circle, white numerals.
- Day detail page: `Today, September 23` title, week strip, grouped cards
  (`Log`, `Logged`), big blue CTA (`Next`), quiet `Skip`.

Mapping: tappable month-year label + chevrons, `SUN–SAT` header, filled
selection, agenda rows as grouped cards, gradient CTA + quiet secondary.

## Shared language (all four)

- 20px screen insets, 16px card radii, 12–16px section rhythm.
- Small-caps gray labels for hierarchy (`type.eyebrow`), never competing
  with numbers.
- One action color per view; destructive and status colors reserved.
- Cards group by proximity and tone, not by outlines (dark mode especially).

## Deliberate deviations

- Our signature is ember-on-stone with a breathing ring + aura; we do not
  copy Opal's gem or Forest's tree — one living metaphor only.
- Month paging instead of Health's infinite scroll (testability).
- Forms stay on native Modal; display content uses native sheets.
