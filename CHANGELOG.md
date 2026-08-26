# Changelog

All notable changes to Warboss Companion are documented here.
Format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]
- Claude Code adopted as the implementation surface, running locally against the
  dev repo. It cannot see this project's Claude Project instructions or its
  attached rules PDFs, so anything it needs to know now has to live in the repo
  itself. No app behaviour changed and no cache bump is required — the only
  runtime change is to the Apps Script backend, which does not ship from here
  - `CLAUDE.md` added at the repo root — the file Claude Code loads at the start
    of every session. Covers what the project is and that Dan is the sole,
    non-professional developer; the stack; what is and is not in the repo;
    deployment and the two cache-version numbers; the five-point design
    checklist as something to *produce and report* rather than hold privately;
    worked bad-versus-good examples of how to put a design decision and how to
    write test steps; the architectural rules; and a "things that look like bugs
    and are not" section covering `validateUnitEnums()`'s deliberate throw, the
    `WBC.armyData` alias, and the positional-column coupling to `Code.gs`.
    Adapted from the Project instructions rather than copied — those are written
    for a conversation, this is written for an agent working in a codebase
  - `apps-script/` added, holding a reference copy of `Code.gs` plus a README.
    The running copy still lives inside the Sheets workbook and nothing here
    deploys it. Until now half the request/response contract `sheets.js` depends
    on was invisible to anything reading the repo, and `Code.gs` had no version
    history at all
  - `Code.gs`: added `CODE_VERSION` and a `?action=version` GET route, answered
    before any tab handling so it needs no other parameters. The repo copy and
    the deployed copy can otherwise diverge silently, and because writes place
    values by position a mismatch does not fail — it puts the wrong values in
    the wrong cells with no error. The version ping makes that visible in one
    browser hit. Also corrected the file's own documentation: the request
    contract and the `doPost` header both omitted the `delete` action, which has
    been implemented and called by `sheets.js` all along. **Not deployed by
    committing** — it needs pasting into the Apps Script editor and the existing
    deployment editing (not a new one, which would change the URL)
  - Reviewed `Code.gs` for credentials before it entered a public repo's
    permanent history: none. It reaches the Sheet with
    `SpreadsheetApp.getActiveSpreadsheet()` rather than a hardcoded ID, and
    holds no keys, tokens or addresses. A header block now records that the file
    is public and that anything of that kind belongs in Script Properties
  - `SPEC.md`: removed the *Precise Code Placement* subsection from §2. It
    required a literal anchor line with every code instruction — a convention
    for pasting snippets into a chat, which an agent editing files directly does
    not need. The other four §2 principles describe the software rather than the
    collaboration and are untouched
  - `docs/RULES_NOTES.md` added — where a rule fact goes once confirmed, so the
    same question is not asked twice. Scope policy at the top: cite, never
    quote; demand-driven, never systematic; the army data already in `data/` is
    a ceiling, not a precedent. Paired with a rewritten *Game rules* section in
    `CLAUDE.md` telling Claude Code to stop and ask rather than state a rule it
    cannot verify, and never to paste rulebook sentences into a tracked file —
    including rule text pasted into the session to answer its own question
  - `docs/GIT_WORKFLOW.md` added — branch, review the diff, test locally, merge,
    test on the phone, deploy live by hand; and why a branch is an undo button
    rather than a preview, since Pages serves only `main`. Explicitly marked as
    current practice rather than a permanent rule, with the four conditions that
    would justify rewriting it
  - `docs/training-question-workflow.md`: fixed the now-dangling *Precise Code
    Placement* cross-reference, and made explicit that the workflow runs in a
    chat rather than Claude Code — it depends on the rulebook and FAQ, which are
    deliberately not in the repo, so it has to run where those files legitimately
    are
  - `.gitignore` added. The repo had none. Most important entry is `*.pdf`: the
    rules PDFs are Mantic's copyrighted material, keeping a copy in the working
    folder is fine and committing one is not, and a public repo's history has no
    cleanup path
- Muster: an army's points limit is now saved with the army. Changing it from
  2000 to 2300 and reopening the army showed 2000 again — the limit lived only
  in the in-memory draft, was hardcoded in three places, and was never written
  to or read back from the army record. Stored on the army rather than per
  device, so it is the same at the table as on the desktop
  - Google Sheet (manual, outside the code change): `pts_limit` column added to
    the `armies` tab, to the right of `faction_id`. No backfill — existing rows
    hold a blank cell and read as the default limit until next saved
  - `Code.gs` (Apps Script backend): added `pts_limit` to `COLUMNS.armies` as
    the rightmost column, after `faction_id`. Also hardened `upsertRow()`: the
    "keep what the sheet already holds" fallback for an unmentioned field looked
    the existing value up with `headers.indexOf(col)` without checking for `-1`,
    so a column present in `COLUMNS` but missing from Row 1 indexed `[-1]`,
    yielded `undefined`, and silently wrote a blank. That is precisely the
    failure mode of adding a column to the code before the sheet, and it failed
    invisibly; it now resolves to an explicit empty string, with the ordering
    requirement stated in the file header and SPEC §4
  - `muster.js`: three hardcoded `2000` literals collapsed into
    `DEFAULT_PTS_LIMIT`, joined by `MIN_PTS_LIMIT` / `MAX_PTS_LIMIT` — the same
    constants now generate the number input's `min`/`max` attributes and bound
    the new `_normalisePtsLimit()` helper, so control and validation cannot
    drift. Every externally-supplied limit (Sheets row, cache, input box) passes
    through that one helper: empty/missing/unparseable falls back, out-of-range
    clamps. The Edit handler carries the stored limit into the draft via a
    `data-pts-limit` attribute instead of assuming the default; the save payload
    writes `pts_limit`; saved-army cards read `N units · total / limit pts` with
    the total marked when over
  - `muster.js` (same pass): the limit input previously validated only the floor
    (100) and not the ceiling (9999) its own `max` advertised, and on a rejected
    value silently kept the old number while continuing to display the typed
    text — the box could lie about what was stored. It still reacts on
    change (blur/Enter) rather than per keystroke, since normalising mid-typing
    would fight the user at "2" and "23" en route to "2300", but the accepted
    value is now written back into the field
  - `sheets.js`: no behaviour change (records pass through the proxy
    transparently); the `saveArmy` doc shape now documents `pts_limit`
  - `style.css`: `.muster-army-card-pts--over` for an over-limit card total
  - `service-worker.js`: cache bumped `wbc-v28` → `wbc-v29` (`muster.js`,
    `sheets.js`, `style.css` changed)
  - Verified against the shapes Sheets actually returns: `"2300"` and numeric
    `2300` both resolve to 2300; blank cell, missing column, `null` and
    `"two thousand"` all resolve to 2000; `50` and `250000` clamp to 100 and
    9999; clearing or mistyping the box while editing a 2300 army keeps 2300
  - SPEC.md updated: `pts_limit` in the `armies` schema with the two-tail-column
    ordering caveat and a sheet-before-`COLUMNS` warning; a *Points limit*
    subsection in Muster (§5.1); the deferred-enforcement wording tightened
    (stored and displayed now, not merely captured); a shipped roadmap entry
- Muster: a Goblin Wiz could only take one of its four spells. The four spell
  options in `goblins.json` carried `"group": "wiz-spell"`, which the app
  correctly reads as choose-one — but the rulebook lists them semicolon-
  separated as independently-priced upgrades ("Lightning Bolt (3) for +20 pts;
  Bane Chant (2) for +20 pts; …"), and the Magic chapter is explicit that a
  spellcaster may buy several spells. The one-per-Turn cap is on *casting*, not
  buying. A data-authoring slip, not a code bug — the Elf Mage's spells were
  already authored correctly with no group, which is what confirmed it
  - `data/armies/kow/goblins.json`: removed `"group": "wiz-spell"` from the
    Wiz's four spell options. No code change was needed for the fix itself —
    the engine already handled independent options and additive costs. The
    Giant's Club-or-Cleaver group is a genuine either/or and is untouched;
    those were the only two groups in the whole dataset
  - Saved armies needed no migration: a saved list holds option ids, never the
    group name, so existing armies load unchanged and simply gain the ability
    to add more spells
- Duplicate-spell handling — a consequence of the above, since a Wiz can now
  hold Hex from an upgrade *and* from the Trickster's Wand, paying twice for
  one effect. Design decision: allow the selection and explain it, rather than
  forbid it — a player may have a reason to hold both, and silently refusing a
  legal purchase is worse than accounting for it
  - `resolver.js`: a duplicate pass runs after all options and the artefact have
    applied, so it sees the unit's final spell set. Redundant copies are dropped
    from the effective spell list (the unit card shows one `Hex (2)`, which is
    the truth) and each collision produces a plain-English message. Points are
    deliberately *not* refunded — the player really did spend them, and quietly
    adjusting the total would make it disagree with the list they built. Which
    copy survives is deterministic (authored option order, then the artefact),
    so the result never depends on click order
  - Detection also covers spells printed on a profile as plain `special_rules`
    strings (Grupp Longnail's "Hex (2)", the Green Lady's "Heal (4)"), matching
    the exact spell name or the name followed by `" ("` — that trailing bracket
    is what stops `Heal` matching an unrelated `Healing Aura (2)`. Only the
    names actually being granted are searched for, so no master spell list is
    needed
  - `resolver.js`: `resolve()` returns a new `notices` array alongside the
    existing `warnings`, kept deliberately separate — `warnings` are authoring
    diagnostics phrased for whoever maintains the data and belong in the
    console; `notices` are player-facing and safe to render. Merging them would
    have leaked `Unknown option id "x" for unit "y" — ignored.` into a player's
    options panel. The public `spells` shape stays exactly `{ spell, power }`
    (an internal `_source` used for the messages is stripped before return), so
    Battle's saved roster snapshots are unaffected and `battle.js` needed no
    change at all
  - `muster.js`: notices lead the unit's expand panel, above the options they
    describe, with a ⚠ marker on the collapsed row so the condition survives
    closing the panel. Purely derived — recomputed every render, so they appear
    and disappear as options and artefacts toggle, with nothing stored,
    invalidated or migrated. Nothing renders when there is nothing to say
  - `style.css`: amber (not blood-red) notice block and row marker — the
    selection is legal and was accepted, so this is advice, not an error
  - `service-worker.js`: cache bumped `wbc-v27` → `wbc-v28` (`goblins.json`,
    `resolver.js`, `muster.js`, `style.css` changed). Superseded by `wbc-v29`
    above when the points-limit work followed; both ship together
  - Verified against the real data: Lightning Bolt + Bane Chant resolves to
    95 pts with both spells; all four spells plus the fleabag to 135; Hex
    upgrade + Trickster's Wand yields one Hex and a notice; a near-miss
    `Healing Aura (2)` correctly does *not* suppress `Hex`; the Giant's
    either/or still behaves as one
  - SPEC.md updated: the two-channel `warnings`/`notices` decision under
    Architecture; a *Duplicate spells* subsection and a notices bullet in Muster
    (§5.1); a `group` field-contract warning about when grouping is and is not
    appropriate (the authoring trap behind this bug); a `grant_spell` note; a
    localStorage-schema note that `spells` is already de-duplicated at snapshot
    time; a shipped roadmap entry
- `service-worker.js`: expanded the `CACHE_VERSION` comment. It said to bump the
  version when "the file list or strategy changes" and did not mention file
  *contents* — but same-origin requests are Cache-First with no revalidation, so
  an edited `js/`, `css/` or `data/` file stays invisible until the version
  changes. Forgetting it presents exactly as "the fix didn't work". Also
  recorded in SPEC §3 under PWA & Offline Strategy
- Known gap surfaced (not a code change): there is no service-worker update
  prompt. `index.html` registers the worker but listens for neither
  `updatefound` nor `controllerchange`, so a new version is adopted silently on
  the *next* load rather than the current one. Harmless while deploying and
  reloading as a single user; at the small-group phase it becomes "they are
  playing off last week's points values and do not know it". Logged as SPEC §8
  open question 9
- Faction selection in Muster — the player now chooses a faction when creating
  an army, and Muster/Battle resolve each army against its own faction. Closes
  the "no faction picker" gap flagged in the Elves entry below (Elves data is
  now reachable in the UI, not just shipped) and completes the deferred
  service-worker deploy step. Built in three staged passes (faction-data model +
  schema → Muster picker → Battle resolve + offline), verified against existing
  Goblin armies at each stage boundary
  - `app.js`: replaced the single `WBC.armyData` global (which auto-loaded
    `armyIndex.armies[0]`) with `WBC.factionData`, a cache keyed by faction id.
    Every faction in the manifest is loaded at boot (`_loadOneFaction`), each
    isolated so one failing surfaces a notice without blocking the others.
    Added `WBC.getFactionData(id)` — the single defaulting lookup (missing or
    unknown id → legacy `goblins`, so pre-faction armies still resolve).
    `_validateArmyEnums` now validates every loaded faction, not just the
    default. `WBC.armyData` retained as a **temporary** back-compat alias
    (`_syncArmyDataAlias`, pointing at the default faction) — marked for removal
    (SPEC §7)
  - `muster.js`: the new-army flow gains a faction picker (a dropdown built from
    the army manifest; auto-selected and shown as a fixed label when only one
    faction exists). No silent default — Save stays disabled until a faction is
    chosen. The unit picker is scoped to the chosen faction (empty, with a
    "choose a faction first" hint, until one is picked); changing faction after
    units are added confirms and clears them. Editing a saved army shows its
    faction as a read-only label (fixed at creation). `_resolveUnit`,
    `_entryPts`, and `_savedArmyPts` thread a faction id (defaulting to the
    draft's); the save payload writes `faction_id` and takes `game_system` from
    the chosen faction's own data
  - `battle.js`: `_findUnitInArmyData(unitId, factionId)` now resolves via
    `getFactionData`. The army-select dropdown prices each saved army against
    its own faction, and the game-start roster resolves the chosen army against
    its `faction_id`. `resolver.js` unchanged — it already takes the unit object
    as input, so only the *source* of that object changed
  - `sheets.js`: no behaviour change (records pass through the proxy
    transparently); the `saveArmy` doc shape now documents `faction_id`
  - `Code.gs` (Apps Script backend): added `faction_id` to `COLUMNS.armies` as
    the rightmost column. Writes place values by position, so this must match
    the physical column order in the sheet — noted in the file header and
    SPEC §4
  - `service-worker.js`: added `data/armies/kow/elves.json` to the precache and
    bumped the cache version `wbc-v25` → `wbc-v26`, completing the deploy step
    deferred in the Elves entry
  - Google Sheet (manual, outside the code change): `faction_id` column added to
    the `armies` tab and backfilled to `goblins` for existing rows
  - SPEC.md updated: faction data model + `WBC.armyData` alias under
    Architecture; load-all-at-boot and per-faction validation in Data Flow;
    `faction_id` in the `armies` schema (with the column-order caveat);
    faction-scoped resolution notes; a Faction selection subsection in Muster
    (§5.1) and a Battle (§5.2) note; roadmap entries for the shipped feature and
    the `WBC.armyData` alias-removal cleanup
- Elves army reference — the first faction authored on the hardened type/size
  template (see G1 below). Transcribed faithfully from the KoW 4E rulebook
  army-list section, staged (base stats → options/availability → assembled
  JSON) with a per-unit verification table against the source
  - Added `data/armies/kow/elves.json`: 27 units / 40 size-entries across the
    Core & Auxiliary, Specialist, Support, Champion, and Warlord sections.
    `ne` single-valued (no `+`); every single-model unit `size: "1"`; all
    `unit_id`s unique; points present on all entries; passes
    `validateUnitEnums()` against `kow-enums.json`
  - `data/armies/kow/index.json`: registered the faction (`{ "id": "elves",
    "name": "Elves", "file": "elves.json" }`). Registration here is now part
    of the definition-of-done for adding a faction — a faction file is only
    discoverable once listed in the manifest
  - Introduced the optional `composition_notes` field (array of verbatim
    strings) for inherent, non-chosen list-building rules a hero grants to
    *other* units (Drakon Lord & Dragon Kindred Lord → Drakon Riders become
    Specialist; Nimue → Kindred Gladestalker Regiments become Core). Kept out
    of `special_rules`; a clean read-target for the future composition system.
    Capture-only in v1
  - Captured the source pattern that one section heading can span two
    categories ("Core and Auxiliary"), with `(AUX)` on a size row as a per-row
    Auxiliary override. The Archwraith → Boskwraiths battalion upgrade is
    stored as a battalion-scope option (description-only — actioning
    cross-unit effects is a roadmap item)
  - SPEC.md updated: Elves in the army-manifest example + faction-registration
    note; the PDF category-derivation note; a `composition_notes` data-
    structure entry; and a v0.3+ roadmap item for army-composition validation /
    cross-unit battalion effects
  - Known gap surfaced (not a code change): Muster has no faction picker — the
    app auto-loads `armyIndex.armies[0]` (Goblins), so Elves data ships but is
    not yet selectable in the UI. Faction selection is a new feature still to
    be designed
  - Deploy step (outside this change): bump the service worker cache version
    and add `data/armies/kow/elves.json` to the precache list so the faction
    loads offline
- Unit `type`/`size` schema hardening (G1) — introduced a canonical type/size
  vocabulary and a load-time validation guard, ahead of authoring the remaining
  19 KoW factions from the audited Goblins template
  - Added `data/systems/kow-enums.json`: canonical `unit_types` (18) and
    `unit_sizes` (5, including `"1"` for all single-model units), plus a
    `type_inheritance` map recording that Heavy/Monstrous Infantry follow
    Infantry/Large Infantry rules (larger bases only)
  - `resolver.js`: added `validateUnitEnums(units, enums)` — pure and fail-loud
    (throws a single located Error listing every offending `unit_id` + field).
    Being pure, it is reusable unchanged in a future Node/CI pre-deploy check
  - `app.js`: loads the enum file via a new `enum_file` manifest field
    (mirroring `artefact_file`), non-blocking; runs the guard once both army
    data and enums resolve. The fail-loud validator is reconciled with Fail
    Gracefully at the call site (`_validateArmyEnums`) — the throw is caught,
    logged in full to `console.error`, and surfaced as a one-line data notice
    (first offending unit_id + field), without blocking boot or nulling
    `armyData`. A missing/malformed enum file warns that the guard is INACTIVE
    rather than skipping silently
  - `data/systems/index.json`: added `"enum_file": "kow-enums.json"`
  - `goblins.json`: normalised 21 single-model entries to `size: "1"` and
    corrected Giant and Goblin Slasher to `type: "Titan"` (previously
    `Monster`, with Titan mis-stored in `size`). Values-only — no `unit_id`
    changed, so saved armies are unaffected. `Individual` retained as a special
    rule, never a size
  - SPEC.md updated: new *Unit type & size (controlled vocabulary)* subsection,
    a `data/systems/kow-enums.json` data-structure section, the `enum_file`
    manifest field, the fail-loud/catch-and-surface pattern under Data Flow,
    and the file tree
  - Deploy step (outside this change): bump the service worker cache version
    (`resolver.js` and `app.js` changed) and add `kow-enums.json` to the
    precache list so the guard runs offline
- Rules-accuracy audit of the original 35 Training Ground questions against
  the KoW 4E mini-rulebook and FAQ (structural validation done; rules-
  correctness pending)
- Training Ground: added 20 new questions to `data/systems/kow-training.json`
  (35 → 55), rebalancing category coverage — `command` and `unit_stats` were
  the thinnest categories going in
  - Verified at write time per `docs/training-question-workflow.md` Phase 3:
    each answer checked against the mini-rulebook/FAQ (plus a Full Rulebook
    citation for Radiance of Life), with section-name sourcing rather than
    page numbers; in-game unit references (Sharpstick Thrower, King on
    Chariot, Wiz) cross-checked against `goblins.json`
  - Phase 5 review against the combined 55-question bank: no true duplicates,
    no distractor collisions, answer-index distribution flat (14/14/14/13)
  - Category totals after merge: morale 9, movement 6, ranged 6, melee 6,
    scenario 6, magic 5, special_rules 5, terrain 5, unit_stats 4, command 3
  - No SPEC.md change required — schema and category set are unchanged, this
    is a pure content addition
  - Service worker cache bump handled manually (outside this change)

## [0.3.6] - 2026-07-09
### Added
- Training Ground: expanded question bank from 55 to 75 questions (+20), 2 new questions per category across all 10 categories.
- Added 3 Elves-specific questions (Rodinar's Presence, Hunting Cat, Kindred Tallspears' Phalanx) alongside 17 generic/Goblin-compatible questions.

### Changed
- Service worker cache bumped to `wbc-v27` to serve the updated `kow-training.json` to existing installs.

## [0.3.5] - 2026-07-04
### Fixed
- Settings and Training Ground buttons could render above the page title — level with the iOS status bar icons — when Warboss Companion was installed as a standalone PWA via "Add to Home Screen". Caused by `#gear-btn` and `#training-btn` using a fixed `top: 14px` while the page title correctly accounted for `env(safe-area-inset-top)`. Both buttons now use `calc(env(safe-area-inset-top, 0px) + 14px)`, matching the title's inset handling. No visual change in Safari or desktop browsers (inset is `0px` there).

## [0.3.4] - 2026-07-04
### Fixed
- Muster: replaced the 0.3.3 sticky-footer approach for the Save Army button —
  position:sticky drifted mid-scroll on iOS Safari (its anchor point is
  unreliable when the scroll container's height comes from flex-1 inside a
  100dvh ancestor, as the address bar's dynamic resizing recalculates the
  offset). Replaced with a non-scrolling page + dedicated .muster-scroll
  inner container + a true flex-sibling action bar — the same mechanism
  that already keeps the bottom nav reliably in place, immune to the same
  viewport-resize interaction
- `service-worker.js`: cache bumped to `wbc-v25` (style.css, muster.js changed)

## [0.3.3] - 2026-07-04
### Changed
- Muster: the Save Army button is now sticky at the bottom of the builder
  screen, so it's reachable without scrolling past the full unit list —
  positioned to never overlap the bottom nav or the protruding Battle icon
  (both sit outside the Muster page's own scroll box, so no overlap is
  possible by construction)
- Save status/error messages moved inside the sticky action bar so feedback
  stays visible alongside the button
### Fixed
- `service-worker.js`: cache bumped to `wbc-v24` (style.css, muster.js changed)

## [0.3.2] - 2026-07-03
### Added
- Artefacts Consumption: magic artefacts are now authored per unit in Muster and
  displayed in Battle, with full effect application
- `data/systems/kow-artefacts.json`: the magic artefact catalogue — all 44 KoW 4E
  artefacts (26 common, 18 heroic) from the Rulebook Magic chapter, each with
  cost, description, per-artefact restrictions, and structured effects where the
  effect is an unconditional profile change (conditional/bespoke artefacts are
  description-only by design). System-level data, loaded via the new optional
  `artefact_file` manifest field
- `kow.json` `artefact_rules` block: data-driven artefact eligibility
  (max-per-unit, unique-per-army, global exclusions for War Engines / non-hero
  Monsters / Unique `[U]` units, and common/heroic class gates) — no eligibility
  strings hardcoded in JS
- `js/resolver.js`: `resolve()` gains an optional third `artefact` argument;
  new `modify_field` effect type (a numeric delta with optional min/max clamp,
  type-preserving so string-stored fields like `ne` round-trip correctly);
  `add_weapon` gains an optional weapon-level `special_rules`; new pure
  eligibility functions `isArtefactEligibleForUnit` / `getEligibleArtefacts`
- Muster: per-eligible-unit Artefact section in the expand panel — single-select
  with deselection, Common/Heroic badges, live points, and unique-per-army
  enforcement (artefacts equipped elsewhere in the draft are disabled)
- Battle: the equipped artefact is snapshotted into the roster's effective
  profile at game start and shown as a visually distinct chip
- `js/app.js`: Fail-Gracefully artefact-catalogue loader, parallel to the army
  index and outside the blocking boot path
### Changed
- Saved-army `units` entries may now carry an `artefact` id alongside `options`.
  Readers accept legacy, options-era, and current forms; writers always write the
  current `{ unit_id, options, artefact }` form. Old armies load unchanged and
  migrate on next save (Fail Gracefully)
- `service-worker.js`: cache bumped to `wbc-v23`; `kow-artefacts.json` added to
  the precached shell


- `js/resolver.js`: new shared module — the single place effective profiles and
  effective points are computed. Given a unit and selected option ids it applies
  all four effect types (`add_special_rule`, `set_field`, `add_weapon`,
  `grant_spell`) and also normalises the saved-army `units` field. Pure logic;
  no DOM, localStorage, Sheets, or fetch. Consumed by both Muster and Battle so
  option logic is never duplicated (Way of Working #3)
- Muster: per-unit options panel — independent toggles, mutually-exclusive
  groups (single-select with deselection), and informational battalion-scope
  rows; live points recompute; picker now grouped by `category` (Core,
  Auxiliary, Specialist, Support, Commander) with display-only `availability`
  badges (Limited / Unique) and an options marker
- Battle: roster cards now show the **effective** profile (mounted/upgraded
  unit), with fitted-option chips under the unit name and any added weapons /
  granted spells as compact sub-lines. The effective profile is snapshotted onto
  each roster instance at game start and never re-resolved mid-game
### Changed
- Saved-army `units` field: entries may now be `{ unit_id, options }` objects as
  well as bare `unit_id` strings. Readers accept both; writers always write the
  object form. Legacy `unit_id`-only armies load unchanged and migrate on next
  save (Fail Gracefully)
- `service-worker.js`: cache bumped to `wbc-v22`; `js/resolver.js` added to the
  precached shell
### Fixed
- Muster: an army containing a `retired: true` unit no longer renders it as
  "(not found)" or silently drops its points when edited. Retired units resolve
  and count correctly for armies that already reference them; retirement only
  hides a unit from *new* selection in the picker (unit_id immutability protects
  the reference — Battle already handled this correctly)
### Notes
- `availability` caps and battalion-scope option effects are captured and shown
  but not yet enforced — per-Battalion / per-army composition validation lands
  with the future army-composition system


  an archery-target button beside Settings (top-right) — kept out of the bottom
  nav to signal experimental status
- `data/systems/kow-training.json`: hand-authored question bank (35 questions)
  plus the locked 10-category vocabulary block
- Optional `training_file` field on system entries in `data/systems/index.json`,
  so a system's question bank is discoverable via the manifest
- `docs/training-categories.md`: question-authoring guidelines (reference only;
  not shipped in the app bundle)
### Changed
- `service-worker.js`: cache bumped to `wbc-v20`; `js/training.js` and
  `data/systems/kow-training.json` added to the precached shell
### Notes
- Question order is shuffled per session; option order is re-shuffled on every
  presentation of a question. v1 is stateless — no progress or history is kept
- The mode loads its bank lazily, outside the boot chain, and fails gracefully
  to an empty/error state if the bank is missing or malformed — Muster, Battle,
  and Chronicle are unaffected either way

## [0.2.0] - YYYY-MM-DD
> Date to confirm. Entries reconstructed from SPEC.md §7 (items marked shipped).
### Added
- Chronicle mode: past-games browser (reverse-chronological, tap to expand)
- Muster mode: army builder with save/load
- Battle mode: load a saved army from Muster into the roster
### Changed
- UI polish and mobile optimisation

## [0.1.0] - YYYY-MM-DD
### Added
- Battle mode: turn tracker, phase display, unit roster with Routed toggle
- Battle mode: phase prompts from `kow.json`, quick note per turn, game-end flow
- Chronicle mode: post-game logging form
- PWA: installable, works offline in Battle mode
- `kow.json` full turn sequence and prompts; `goblins.json` unit roster
