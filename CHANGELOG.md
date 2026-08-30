# Changelog

All notable changes to Warboss Companion are documented here.

Versioning follows a simplified semantic scheme:

* MAJOR (e.g. 0.4 → 1.0) — a change of backend or delivery architecture, such as a
  future Google Sheets → Supabase migration.
* MINOR (e.g. 0.4 → 0.5) — user-facing features, UI changes, content-pipeline work,
  and bug fixes.

Entries are the record of what changed and when. Reasoning that is still true of the
system belongs in `SPEC.md`, which describes it as built; planned work is tracked in
`SPEC.md` §7. Entries are kept short — a one-line summary and bullets naming what
changed and where.

Releases up to 0.3.6 used three-part numbers and are left as they were; two-part
numbering starts at 0.4.

## [Unreleased]

### Changed
- Development hosting/privacy boundary hardened:
  - `warboss-companion-dev` is now private; its public development preview is deployed
    by Cloudflare Workers Static Assets at `warboss-companion-dev.nimbrethil81.workers.dev`
  - `.assetsignore` is default-deny and publishes only the explicitly approved 29-file
    public asset set
  - `.github/workflows/deploy-to-live.yml` now uses a separate default-deny `rsync`
    allow-list, so new dev-repo files do not enter the public live repo automatically
  - public boundary was tested before and after the private-repo conversion, including a
    fresh private test file that remained 404 on the Cloudflare Worker
- Project documentation updated for the private-dev / Cloudflare-preview / public-live
  architecture: `README.md`, `CLAUDE.md`, `SPEC.md`, `docs/GIT_WORKFLOW.md`, and
  `apps-script/README.md`.
- `apps-script/Code.gs` is explicitly documented as private dev-only reference source,
  excluded from both public allow-lists. `CODE_VERSION` bumped to `2026-08-30a` for the
  repo-copy update; application logic is unchanged.

## [0.4] - 2026-08-27

### Added
- Faction selection in Muster — a faction is chosen when an army is created, fixed
  thereafter, and each army is resolved against its own faction.
  - `js/app.js`: `WBC.factionData`, a cache keyed by faction id, replaces the single
    `WBC.armyData` global (retained as a temporary back-compat alias); every faction
    loads at boot; new `WBC.getFactionData(id)`; enum validation runs per faction
  - `js/muster.js`: faction picker on the new-army flow, faction-scoped unit picker,
    read-only faction label when editing, `faction_id` in the save payload
  - `js/battle.js`: `_findUnitInArmyData()` and the army-select dropdown resolve via
    `getFactionData`
  - `apps-script/Code.gs`: `faction_id` added to `COLUMNS.armies` as the rightmost column
  - Google Sheet (manual): `faction_id` column added to the `armies` tab, backfilled
    to `goblins`
- Elves army reference — `data/armies/kow/elves.json`, 27 units / 40 size-entries,
  registered in `data/armies/kow/index.json`. Introduced the optional
  `composition_notes` field for inherent list-building rules.
- Unit `type`/`size` controlled vocabulary and load-time validation.
  - `data/systems/kow-enums.json`: canonical `unit_types` (18), `unit_sizes` (5) and a
    `type_inheritance` map
  - `js/resolver.js`: new pure `validateUnitEnums(units, enums)`
  - `js/app.js`: loads the enum file via the new `enum_file` manifest field, non-blocking
  - `data/systems/index.json`: `enum_file` entry added
  - `data/armies/kow/goblins.json`: 21 single-model entries normalised to `size: "1"`;
    Giant and Goblin Slasher corrected to `type: "Titan"`
- Army points limit stored on the army record rather than defaulting per session.
  - `js/muster.js`: `DEFAULT_PTS_LIMIT` / `MIN_PTS_LIMIT` / `MAX_PTS_LIMIT` replace three
    hardcoded literals; new `_normalisePtsLimit()`; limit carried into the draft and
    written on save; saved-army cards read `N units · total / limit pts`
  - `css/style.css`: `.muster-army-card-pts--over`
  - `apps-script/Code.gs`: `pts_limit` added to `COLUMNS.armies` as the rightmost column
  - Google Sheet (manual): `pts_limit` column added to the `armies` tab, right of
    `faction_id`. No backfill needed.
- Duplicate-spell handling — a spell held twice is collapsed and explained rather than
  forbidden.
  - `js/resolver.js`: duplicate pass after options and artefact apply; `resolve()` now
    returns a `notices` array alongside `warnings`
  - `js/muster.js`: notices lead the unit's expand panel, with a ⚠ marker on the
    collapsed row
  - `css/style.css`: amber notice block and row marker
- Battle unit card expansion — tapping a card shows the full six-stat line and the
  untruncated rules together, with the current phase's stats kept gold.
  - `js/battle.js`: replaces the separate rules-row tap handler, its `data-expanded`
    attribute and its chevron; expansion held in module memory, keyed by `inst_id`
- Wavering marker in Battle — per-unit Waver toggle with badge, accent strip,
  restriction reminder and a header tally.
  - `js/battle.js`: new `_isWavering()`, the single read site for `wavered_at`
  - `data/systems/kow.json`: new `unit_states` block alongside `quick_reference` and
    `artefact_rules`, carrying the badge label and reminder line
  - `wbc_active_game` unit shape gains `wavered_at` (absent until first marked, so no
    migration)
- Training Ground: question bank expanded 35 → 55 in `data/systems/kow-training.json`,
  rebalancing `command` and `unit_stats` coverage.
- Repo documentation for Claude Code, now the implementation surface.
  - `CLAUDE.md` at the repo root: what the project is, the stack, deployment and the two
    cache-version numbers, the design checklist, architectural rules, and a "things that
    look like bugs and are not" section
  - `apps-script/`: reference copy of `Code.gs` plus a README. The running copy still
    lives in the Sheets workbook; nothing here deploys it
  - `apps-script/Code.gs`: `CODE_VERSION` and a `?action=version` GET route, so the repo
    copy and the deployed copy cannot diverge silently. **Not deployed by committing** —
    paste into the Apps Script editor and edit the existing deployment
  - `docs/RULES_NOTES.md`: confirmed rule facts, with a cite-never-quote scope policy
  - `docs/GIT_WORKFLOW.md`: branch, review, test locally, merge, test on the phone,
    deploy by hand
  - `.gitignore`: the repo had none; `*.pdf` excluded so the rules PDFs never enter history

### Changed
- `service-worker.js`: cache bumped `wbc-v25` → `wbc-v30` over the course of this
  release; `data/armies/kow/elves.json` added to the precached shell.
- `index.html`: `css/style.css` `?v=7` → `?v=8`, `js/battle.js` `?v=9` → `?v=10`.
- `service-worker.js`: `CACHE_VERSION` comment expanded — the bump is required whenever
  a shell file's *contents* change, not only when the file list or strategy changes.
- `apps-script/Code.gs`: request contract and `doPost` header corrected to document the
  `delete` action, implemented and called all along.
- `SPEC.md`: *Precise Code Placement* subsection removed from §2.
- `docs/training-question-workflow.md`: fixed the dangling *Precise Code Placement*
  reference; noted that the workflow runs in a chat, not Claude Code.

### Fixed
- Muster: a Goblin Wiz could only take one of its four spells — removed
  `"group": "wiz-spell"` from the Wiz's spell options in `data/armies/kow/goblins.json`.
  No code change; saved armies need no migration.
- `apps-script/Code.gs`: `upsertRow()` silently wrote a blank when a column listed in
  `COLUMNS` was missing from Row 1 (`headers.indexOf()` returning `-1` and indexing
  `[-1]`); it now resolves to an explicit empty string.
- `js/muster.js`: the points-limit input validated only its floor, not the ceiling its
  own `max` advertised, and on a rejected value kept the old number while still
  displaying the typed text. The accepted value is now written back into the field.
- `js/battle.js`: phase-prompt detail panels stopped opening once the roster had been
  touched — `_renderRoster()` bound an unscoped click handler to `.prompt-card-header`
  on every call, stacking listeners that cancelled each other out. Binding moved to
  `_renderPromptsBar()`, scoped to the bar.

## [0.3.6] - 2026-07-09

### Added
- Training Ground: question bank expanded 55 → 75 (+20, two per category across all ten),
  including 3 Elves-specific questions.

### Changed
- `service-worker.js`: cache bumped to `wbc-v27`.

## [0.3.5] - 2026-07-04

### Fixed
- Settings and Training Ground buttons could render level with the iOS status bar when
  installed as a standalone PWA.
  - `css/style.css`: `#gear-btn` and `#training-btn` moved from a fixed `top: 14px` to
    `calc(env(safe-area-inset-top, 0px) + 14px)`, matching the page title

## [0.3.4] - 2026-07-04

### Fixed
- Muster: the 0.3.3 sticky Save Army button drifted mid-scroll on iOS Safari. Replaced
  with the mechanism already used by the bottom nav.
  - `js/muster.js`, `css/style.css`: non-scrolling page, dedicated `.muster-scroll`
    container, action bar as a true flex sibling
  - `service-worker.js`: cache bumped to `wbc-v25`

## [0.3.3] - 2026-07-04

### Changed
- Muster: the Save Army button is now fixed to the bottom of the builder screen, with
  save status and error messages beside it.
  - `js/muster.js`, `css/style.css`: sticky action bar
  - `service-worker.js`: cache bumped to `wbc-v24`

## [0.3.2] - 2026-07-03

### Added
- Artefacts Consumption: magic artefacts are authored per unit in Muster, priced live,
  and shown in Battle with their effects applied.
  - `data/systems/kow-artefacts.json`: all 44 KoW 4E artefacts (26 common, 18 heroic),
    with structured effects where the effect is an unconditional profile change
  - `data/systems/kow.json`: new `artefact_rules` block — eligibility as data, not JS
  - `data/systems/index.json`: new optional `artefact_file` field
  - `js/resolver.js`: `resolve()` gains an optional artefact argument; new `modify_field`
    effect type; `add_weapon` gains optional weapon-level `special_rules`; new
    `isArtefactEligibleForUnit` / `getEligibleArtefacts`
  - `js/muster.js`: per-unit Artefact section in the expand panel — single-select with
    unique-per-army enforcement
  - `js/battle.js`: equipped artefact snapshotted into the roster profile, shown as a chip
  - `js/app.js`: artefact-catalogue loader, outside the blocking boot path

### Changed
- Saved-army `units` entries may carry an `artefact` id alongside `options`. Readers
  accept legacy and options-era forms; writers always write the current form.
- `service-worker.js`: cache bumped to `wbc-v23`; `kow-artefacts.json` precached.

## [0.3.1] - YYYY-MM-DD

> Date to confirm.

### Added
- Options Consumption: unit upgrades authored in Muster, priced live, and reflected in
  the Battle roster.
  - `js/resolver.js`: new shared module — the single place effective profiles and points
    are computed (`add_special_rule`, `set_field`, `add_weapon`, `grant_spell`) and the
    saved-army `units` field is normalised. Consumed by both Muster and Battle
  - `js/muster.js`: per-unit options panel (independent toggles, mutually-exclusive
    groups, informational battalion-scope rows); picker grouped by `category` with
    display-only `availability` badges
  - `js/battle.js`: roster cards show the effective profile, with option chips and any
    added weapons / granted spells as sub-lines

### Changed
- Saved-army `units` entries may be `{ unit_id, options }` objects as well as bare
  `unit_id` strings. Readers accept both; writers write the object form.
- `service-worker.js`: cache bumped to `wbc-v22`; `js/resolver.js` precached.

### Fixed
- Muster: an army containing a `retired: true` unit rendered it as "(not found)" and
  silently dropped its points when edited. Retired units now resolve and count;
  retirement only hides a unit from *new* selection.

## [0.3.0] - YYYY-MM-DD

> Date to confirm.

### Added
- Training Ground (beta): multiple-choice rules-recall quiz, reached via an
  archery-target button beside Settings (top-right) — kept out of the bottom nav to
  signal experimental status.
  - `js/training.js`: mode logic; loads its bank lazily, outside the boot chain
  - `data/systems/kow-training.json`: hand-authored 35-question bank plus the locked
    10-category vocabulary
  - `data/systems/index.json`: new optional `training_file` field
  - `docs/training-categories.md`: question-authoring reference (not shipped in the bundle)

### Changed
- `service-worker.js`: cache bumped to `wbc-v20`; `js/training.js` and
  `kow-training.json` precached.

## [0.2.0] - YYYY-MM-DD

> Date to confirm. Entries reconstructed from SPEC.md §7.

### Added
- Chronicle mode: past-games browser, reverse-chronological, tap to expand.
- Muster mode: army builder with save/load.
- Battle mode: load a saved army from Muster into the roster.

### Changed
- UI polish and mobile optimisation.

## [0.1.0] - YYYY-MM-DD

### Added
- Battle mode: turn tracker, phase display, unit roster with Routed toggle.
- Battle mode: phase prompts from `kow.json`, quick note per turn, game-end flow.
- Chronicle mode: post-game logging form.
- PWA: installable, works offline in Battle mode.
- `data/systems/kow.json`: full turn sequence and prompts.
- `data/armies/kow/goblins.json`: Goblin unit roster.
