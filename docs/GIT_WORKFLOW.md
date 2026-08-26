# Git workflow

How changes move from Claude Code to the dev site to the live site, and who does
what at each step.

> **This is current practice, not a permanent rule.** It suits the project as it
> is today: one developer, one user, two repos, no automated tests, no preview
> builds. Several of those will probably change, and when they do this document
> should change with them — see *When to revisit this* at the end. If some part
> of it is costing more than it saves, that is a reason to change it, not a
> reason to follow it harder.

## The three places a change can live

| Where | What's there | Who puts it there |
|---|---|---|
| **A branch** | Work in progress. Not on any website. | Claude Code |
| **`main` on `warboss-companion-dev`** | The dev site. Rebuilds automatically on push. | You, by merging |
| **`warboss-companion`** | The live site. | You, by triggering the deploy workflow |

Claude Code only ever touches the first one. It never pushes to `main` for an
app change, and never touches the live repo at all.

## A branch is not published anywhere

This is the thing that catches people out. GitHub Pages serves `main` and
nothing else, so a branch has no URL. You cannot put a branch on your phone and
try it at the table.

That means a branch is not a preview. In this setup it is three other things:

- **An undo button.** A change that turns out wrong gets deleted and `main`
  never knew about it.
- **A diff you can read** before anything reaches a site.
- **A guarantee `main` always works.** Because `main` *is* the dev site, a
  half-finished change sitting on it means a broken app the next time you open
  it. That is the real reason to branch — "I'll finish this tomorrow" should not
  cost you a working app tonight.

## The loop

**1. Describe what you want.** Claude Code designs it first — options in plain
English, a recommendation, then it stops and waits. It should not start building
until you have chosen.

**2. You choose. It creates a branch and builds.** You will see the branch name
in the terminal, something like `add-damage-tracking`.

**3. It shows you the diff and stops.** Removed lines in red, added lines in
green. This is your review, and the only place you see the change before it can
reach a site.

**4. Test it locally.** Ask Claude Code to start a local web server — for
example `python3 -m http.server 8000` — and open `localhost:8000`. Opening
`index.html` directly does not work: the offline behaviour and the service
worker need a real `http://` address.

**5. Merge to `main`.** Either is fine:

- **Ask Claude Code to merge and push.** Fastest.
- **Open a pull request.** Claude Code pushes the branch and gives you a link.
  You read the diff on GitHub's site — easier than the terminal for anything
  large — and click Merge.

The pull request is optional while you are the only developer. What it buys you
is the web diff view and a written record of *why*. For a two-line fix, merging
locally is fine. For something you will want to understand again in six months,
the PR is worth the extra click.

**6. The dev site rebuilds itself.** A minute or so. Now test properly — on your
phone, as the installed app, the way you would actually use it.

**7. When you are happy, trigger Deploy to Live yourself.** Claude Code will
never do this and is told not to suggest it.

## The trap at step 6

If the change touched a file the app caches, and `CACHE_VERSION` in
`service-worker.js` was not bumped, **the installed app will serve you the old
version** and the change will look like it failed.

It did not fail. You are looking at a cached copy. If something mysteriously
does not appear after a merge, check that first.

Editing `css/style.css` needs *two* numbers bumped: `CACHE_VERSION` in
`service-worker.js` and the `?v=7` on the stylesheet link in `index.html`.

## When to skip the branch

Anything that cannot change what the app does or shows — `SPEC.md`,
`CHANGELOG.md`, `docs/`, `README.md`, `apps-script/`, a code comment. Straight
to `main`.

If you are weighing up whether something qualifies, it does not. Branch it.

## Things that are not git

Two kinds of change do not deploy by pushing, and are not finished when the
commit lands:

- **`apps-script/`** — reference copies only. The running code lives in the
  Google Sheets workbook. See `apps-script/README.md`.
- **The Google Sheet's columns** — added by hand, in the right physical order,
  before the code that writes to them.

## When to revisit this

The workflow above is shaped by four facts that are true today and may not stay
true. If one changes, come back here:

- **Nobody else uses the app.** If that changes, a broken merge stops costing
  you a game and starts costing someone else one. Branches become protective
  rather than convenient, and the pull request stops being optional.
- **There are no automated tests.** If a test suite ever exists, a pull request
  gains the ability to tell you the change is safe before you merge it, which is
  a much better reason to open one than the diff view.
- **A branch cannot be previewed.** If branch preview builds are ever set up,
  step 4 changes completely — you would test the branch on a real URL on your
  phone, and merging to `main` would stop being part of testing.
- **There are two repos.** If dev and live are ever consolidated, or the deploy
  becomes automatic, the safety margin that makes a merge to `main` low-risk
  disappears and this whole document needs rewriting.

Until then, the short version is: **branch anything that changes the app, review
the diff, test locally, merge, test on the phone, and deploy live by hand.**
