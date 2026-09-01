# Changelog

All notable shipped changes to Warboss Companion are recorded here.

Update this file when a notable change ships or an unreleased set is prepared for release. Record each change once, in one concise line.

Versioning follows a simplified semantic scheme:

* MAJOR (for example, 0.4 → 1.0) — a change of backend or delivery architecture.
* MINOR (for example, 0.4 → 0.5) — user-facing features, UI changes, content-pipeline work and bug fixes.

Keep each change to one line. Current technical behaviour belongs in `SPEC.md`; future work belongs in `ROADMAP.md`.

Releases up to 0.3.6 used three-part numbers and are left as they were; two-part numbering starts at 0.4.

## [Unreleased]

### Fixed
- Preserved Battle and Chronicle data across every failed Apps Script write, with reliable idempotent Retry behavior and one reflection row per game key.

### Changed
- Hardened the development-to-live publication boundary with a private development repository and separate default-deny allow-lists for Cloudflare preview and live deployment.
- Updated project documentation for the private-development, Cloudflare-preview and public-live architecture.
- Documented `apps-script/Code.gs` as private reference source and bumped `CODE_VERSION` to `2026-08-30a` without changing application logic.

## [0.4] - 2026-08-27

### Added
- Added faction selection when creating an army, with each saved army permanently associated with and resolved against its chosen faction.
- Added the Elves army reference with 27 units, 40 size entries and optional `composition_notes` support.
- Added controlled vocabularies and load-time validation for unit type and size data.
- Added a stored points limit to each army, including validation and over-limit presentation.
- Added duplicate-spell handling that collapses repeated spells and explains the result.
- Added expandable Battle unit cards showing the complete stat line and untruncated rules.
- Added per-unit Wavering state in Battle with a badge, reminder and header tally.
- Expanded the Training Ground question bank from 35 to 55 questions.
- Added Claude Code instructions, Apps Script reference files, verified-rules notes, Git workflow guidance and PDF exclusion.

### Changed
- Advanced the service-worker cache from `wbc-v25` to `wbc-v30` and added the Elves data to the offline shell.
- Updated browser cache-busting versions for `css/style.css` and `js/battle.js`.
- Clarified that the service-worker cache must be bumped whenever the contents of a shell file change.
- Corrected the Apps Script request-contract documentation to include the existing `delete` action.
- Removed the obsolete Precise Code Placement subsection from `SPEC.md`.
- Corrected the Training Ground authoring workflow to remove a dangling reference and identify its chat-based process.

### Fixed
- Allowed the Goblin Wiz to select more than one of its four spells.
- Prevented Apps Script upserts from writing an undefined value when a configured column is missing from the sheet header.
- Made the Muster points-limit input enforce and display both its minimum and maximum accepted values.
- Restored Battle phase-prompt expansion after roster updates by preventing duplicate click-handler binding.

## [0.3.6] - 2026-07-09

### Added
- Expanded the Training Ground question bank from 55 to 75 questions, including three Elves-specific questions.

### Changed
- Bumped the service-worker cache to `wbc-v27`.

## [0.3.5] - 2026-07-04

### Fixed
- Kept the Settings and Training Ground buttons below the iOS status bar in standalone mode.

## [0.3.4] - 2026-07-04

### Fixed
- Replaced the iOS-unstable sticky Muster save control with a fixed action bar and dedicated scrolling area.
- Bumped the service-worker cache to `wbc-v25`.

## [0.3.3] - 2026-07-04

### Changed
- Fixed the Muster Save Army control to the bottom of the builder with its status and error messages.
- Bumped the service-worker cache to `wbc-v24`.

## [0.3.2] - 2026-07-03

### Added
- Added magic artefact selection in Muster, live pricing, unique-per-army enforcement and resolved effects in Battle.
- Added all 44 Kings of War 4th Edition artefacts and data-driven eligibility rules.

### Changed
- Extended saved-army units with an optional artefact ID while retaining legacy read compatibility.
- Bumped the service-worker cache to `wbc-v23` and added the artefact data to the offline shell.

## [0.3.1] - YYYY-MM-DD

> Date to confirm.

### Added
- Added unit-option selection in Muster with live pricing and resolved profiles in Battle.
- Added shared resolution of effective profiles, points, weapons, spells and saved-unit formats across Muster and Battle.

### Changed
- Extended saved-army units with option IDs while retaining legacy read compatibility.
- Bumped the service-worker cache to `wbc-v22` and added `js/resolver.js` to the offline shell.

### Fixed
- Kept retired units resolvable and included in points totals while hiding them from new selection.

## [0.3.0] - YYYY-MM-DD

> Date to confirm.

### Added
- Added the beta Training Ground with a lazily loaded 35-question multiple-choice rules quiz and authoring guidance.

### Changed
- Bumped the service-worker cache to `wbc-v20` and added Training Ground files to the offline shell.

## [0.2.0] - YYYY-MM-DD

> Date to confirm. Entries reconstructed from an earlier version of `SPEC.md`.

### Added
- Added Chronicle mode as a reverse-chronological, expandable past-games browser.
- Added Muster mode for building, saving and loading armies.
- Added the ability to load a saved Muster army into the Battle roster.

### Changed
- Improved the interface and mobile presentation.

## [0.1.0] - YYYY-MM-DD

### Added
- Added Battle turn tracking, phase display and a unit roster with Routed state.
- Added phase prompts, per-turn quick notes and the game-end flow.
- Added the Chronicle post-game logging form.
- Made the PWA installable with offline Battle support.
- Added the Kings of War turn sequence and phase-prompt data.
- Added the Goblin unit roster.
