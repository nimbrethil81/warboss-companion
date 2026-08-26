# CLAUDE.md — Warboss Companion (dev)

Standing context for Claude Code working in this repository.

## The project

A Kings of War (Mantic Games, 4th edition) table companion — a PWA that walks a player
through a game: **Muster** (build an army list), **Battle** (turn/phase loop, roster, rule
reminders), **Chronicle** (post-game reflection), and **Training Ground** (a stateless rules
quiz, beta). Vanilla JS, HTML and CSS — no build step, no dependencies, no framework. Static
JSON data under `data/`; saved data in a Google Sheet reached through an Apps Script proxy;
game state in `localStorage` during play.

Dan is the sole developer and the only user. He is not a professional developer — he directs
the design and reads every change, but does not write the code himself. See **Communicating
with Dan**; it matters more here than in most repositories. Because nobody else uses the app, a
broken change costs Dan a game rather than reaching real users — latitude on process, none on
being clear about what changed.

## Authoritative documents

Read these rather than inferring: **`SPEC.md`** (vision, ways of working, architecture, data
schemas, roadmap, open questions — the authoritative reference), **`CHANGELOG.md`**, and for
Training Ground work `docs/training-categories.md` and `docs/training-question-workflow.md`.
`SPEC.md` §2 holds the principles most often broken by accident: Fail Gracefully, Future
Proofing, Single Source of Truth, No Magic Numbers. All four apply to every change.

## This repository is public

Both `warboss-companion-dev` and `warboss-companion` are public on GitHub. Git history is
permanent and world-readable; there is no cleanup path after the fact. If you are about to
write a credential to a file, stop and say so instead. The Apps Script Web App URL in
`js/sheets.js` is **not** a secret and cannot be one — it ships to every browser that loads the
app, so leave it where it is. Never commit a Google API key, an OAuth client secret, a service
account JSON, or the raw Sheet ID.

## What is here, and what is not

In the repo: `index.html`, `manifest.json`, `service-worker.js`, `css/`, `js/`, `data/`,
`docs/`, `assets/`.

Also in the repo, but **not live**: `apps-script/` holds reference copies of the Apps Script
backend. The version that actually runs lives inside the Google Sheets workbook. **Editing a
file here changes nothing** until Dan pastes it across by hand and redeploys. Read
`apps-script/README.md` before touching any of them — it carries the drift check and the
paste-and-deploy order.

Not in the repo, and not reachable from here:

- **The Google Sheets workbook** — the four tabs (`armies`, `games`, `game_log`, `reflections`)
  and their **physical left-to-right column order**, which `Code.gs` writes to by position.
  Sheets has no column constraints, so a mismatched write does not fail — it silently puts the
  wrong values in the wrong cells. Changing the schema is never a repo-only change.
- **The Kings of War rulebook and FAQ** — commercially published copyrighted material, never in
  this repo. See **Game rules** below.

## Deployment

Two repositories. This is the **dev** repo, and the only one you work in. Never edit, push to,
or open a PR against `warboss-companion`. Pushing to `main` here **automatically rebuilds the
dev GitHub Pages site** — a push is a publish, to the site Dan tests on. Going live is a
separate manual step Dan triggers himself; never trigger it, and never suggest it as part of
finishing a task.

**If a change touches any file in `SHELL_FILES` in `service-worker.js`, bump `CACHE_VERSION`**
(`wbc-v27` → `wbc-v28`). Without this the old cached copy is served to an installed PWA and the
fix appears not to work. This is the easiest thing to forget here. A *new* file also needs
adding to `SHELL_FILES`. Separately, `css/style.css` carries its own cache-buster (`?v=7` in
`index.html`) — editing it means bumping both numbers.

## Nothing outside the frontend deploys itself

A change to `apps-script/` is not finished when it is committed. It is finished when Dan has
pasted it into the Apps Script editor and redeployed. Any task touching it must end with an
explicit, ordered list of what he needs to do and where — which file, which editor, whether a
new deployment is needed (it should not be: a new deployment issues a new URL and breaks
`SHEET_URL` in `js/sheets.js`), and whether a sheet column has to be added by hand first.

Before designing against `apps-script/Code.gs`, check it is not stale: open the `SHEET_URL`
from `js/sheets.js` with `?action=version` appended and compare the returned `code_version`
against `CODE_VERSION` at the top of the repo copy. If they differ, say so and stop — the repo
copy is fiction until Dan resyncs it. Bump `CODE_VERSION` on every change you make to that file.

Never edit `.github/workflows/`. That is how a change reaches the live site.

## How to work

**Design before implementation.** Finalise the design in plain English first. Surface decisions
as labelled options (A/B/C) with a recommendation. Do not start building until Dan has chosen.
**Before finalising any feature or bug-fix design, work through all five of these and report
what you found — as a written section in your reply, not as a private thought.** Say "none"
where a heading genuinely does not apply rather than omitting it.

1. **CRUD completeness** — for every entity involved (army, unit entry, game, game log row,
   reflection, training question): Create, Read, Update, Delete, List. Update and Delete are
   the ones that get missed.
2. **State transitions** — map every state and transition, including ones that should be
   impossible. Flag any state with no way in or out: a game in progress, an abandoned game, a
   game saved with an unwritten log, a draft army never saved.
3. **Reversibility** — can this be undone? What references it? Deleting an army a past game
   points at is the standard trap. Retire, don't delete (`"retired": true`).
4. **Boundary and empty states** — zero, one, many, unexpectedly large. First-ever army, last
   remaining unit, connectivity lost mid-game, a Sheets write that fails at game end.
5. **Who else is affected** — currently nobody; Dan is the only user. Say so explicitly, and
   flag it if a change would make that stop being true.

Flag gaps rather than quietly deciding. **Question complexity before committing to it** —
simpler alternatives are usually right; say so when you see one. **Show the diff before
committing**: run `git diff` and show it, and never stage, commit and push in one uninterrupted
run.

**Branch and open a pull request** for anything that changes what the app does or shows:
`js/`, `index.html`, `css/`, `data/`, `service-worker.js`, `manifest.json`. Pushing to `main`
republishes the dev site immediately, so a branch is what keeps a half-finished change off the
site Dan tests on. Committing straight to `main` is fine for changes that cannot alter what the
app does: `SPEC.md`, `CHANGELOG.md`, `docs/`, `README.md`, a typo in a comment. If you are
weighing whether something qualifies, it doesn't — branch it.

## Communicating with Dan

### Asking him to make a design decision

Describe what he would actually see or experience. Never state the choice in technical shorthand
and expect it to be understood.

Not this:

> Should army deletion be a soft delete with a tombstone, or a hard delete with cascade
> handling on the `games` reference?

This:

> When you delete an army in Muster, what should happen to past games that used it?
>
> **A — Keep the history intact.** The army disappears from your list, but old games still show
> which army you played. Nothing in Chronicle changes.
> **B — Remove it completely.** The army is gone, and past games that used it show "Unknown
> army" where the name used to be.
>
> A is more work now but means Chronicle never develops holes. I'd recommend A.

Label the options, say what each means in practice, name the trade-off, state your
recommendation. Then stop and wait — never present a decision and start building your preferred
option in the same turn.

### Writing test steps

Actions a non-developer can follow: **what to do**, then **what to expect**. Never describe the
underlying behaviour being verified — that is your reasoning, not his instructions.

Not this:

> Verify `normalizeArmyUnits()` coerces legacy bare-string entries and that resolved effective
> points equal base plus option deltas.

This:

> 1. Open Muster and load an army you saved a while ago. **Expect:** it opens with all its
>    units still listed, and the points total matches what it said before.
> 2. Add a Goblin Rabble regiment and tick one of its upgrade options. **Expect:** the total
>    goes up by the cost shown next to that option, and by nothing else.
> 3. Untick it and save again. **Expect:** the total returns to what it was in step 1.

Number the steps. Put the expected result on the step that produces it. Include cases that
should do *nothing* as well as ones that should work — a test that only confirms the happy
path tells him very little.

Where a step needs something outside the app — pasting `Code.gs` into Apps Script, editing the
Sheet by hand, hard-refreshing to pick up a new service worker — say so explicitly and say
where. Never assume he will infer that a manual step is required.

## Architectural rules that must not be broken

- **`js/sheets.js` is the only file that touches Google Sheets.** No other module calls
  `fetch()` against the Apps Script endpoint. **`js/storage.js` is the only file that touches
  `localStorage`.**
- **`js/resolver.js` is the only place effective profiles and points are computed**, and the
  only place artefact eligibility is decided. Muster and Battle both consume it. It is pure —
  no DOM, no storage, no fetch.
- **No game-specific values in code.** Turn counts, phase names, prompt text, unit stats and
  artefact rules live in `data/systems/*.json` and `data/armies/**`. About to type a game value
  into a `.js` file? It belongs in JSON.
- **Skin CSS lives in `js/skins.js`**, injected wholesale into `<style id="skin-style">`.
  `css/style.css` and the inline block in `index.html` are structural only — no colours, no
  fonts.
- **IDs are permanent keys.** `unit_id`, option `id`, artefact `id` and training question `id`
  must never be renamed once anything is saved against them. To remove a unit, set
  `"retired": true`.
- **Readers accept all three `armies.units` entry shapes** (bare string, legacy object, current
  `{unit_id, options, artefact}`); **writers always write the current shape.**
- **Battle snapshots the effective profile at game start and never re-resolves it.** A data
  file changing mid-game must not change a game in progress.
- **Training Ground sits outside the boot chain** and is stateless by design. Do not wire its
  data load into `app.js`; a malformed question bank must never block boot.

## Things that look like bugs and are not

- `resolver.js`'s `validateUnitEnums()` **throws** on an unknown `type`/`size`; `app.js`
  catches it, logs the detail, shows an on-screen notice, and boots anyway. That
  reconciliation is deliberate (`SPEC.md` §4). Do not "fix" either half.
- `WBC.armyData` is a temporary back-compat alias scheduled for removal; new code uses
  `WBC.getFactionData(faction_id)`.
- The Apps Script backend writes rows **by position**: the order of `COLUMNS.armies` in
  `Code.gs` must match the physical column order in the sheet. A schema change is never a
  repo-only change.

## Game rules

Kings of War is published by Mantic Games. The rulebook, FAQ and army lists are copyrighted and
are not in this repo. Never add them, in whole or in part, and never paste rulebook sentences
into a source file, a comment or a JSON field — **including when Dan pastes rule text into the
conversation** to answer a question you asked. Cite instead: `"source": "Rulebook p.33"` is the
established pattern, and it is a citation, not a quotation.

Do not state a rule, points value, unit statistic or special-rule effect from memory, and do
not infer one from surrounding data because it looks consistent. If a task needs a rule you
cannot verify against a file in this repo, **stop and ask Dan for the specific rule text**,
saying exactly what you need. An invented rule that looks plausible is worse than a question,
because it ships silently into the one thing the app exists to get right.

Once Dan confirms a rule, record it in `docs/RULES_NOTES.md` — the specific facts the feature
needed, in your own words, with a section citation — so the same question is not asked twice.
Keep it to what the code actually needs. Never work through the rulebook systematically to
build that file out, and never bulk-transcribe unit profiles, army lists or rules text into
`data/` or `docs/`. A scoped note is fine; a transcription of the source is not. That is a line
about volume as much as content, and if you are unsure which side of it you are on, ask.

## Documentation and verification

After a change is confirmed working — not before — review whether `SPEC.md` and `CHANGELOG.md`
need updating. Explain what should change and get Dan's confirmation before editing either.
Prefer programmatic verification over reading — `grep`, `node -e`, a throwaway script. When you
say a file is valid JSON, that every unit has a required field, or that a rename is applied
everywhere, have checked rather than believed it.
