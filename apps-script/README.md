# apps-script/ — reference copies, not live code

**Nothing in this folder runs.** These are copies of the Google Apps Script
backend, kept here so the code is version-controlled, diffable, and readable by
anyone (or anything) working in this repository.

The code that actually runs lives inside the Google Sheets workbook, under
**Extensions → Apps Script**. Editing a file here changes nothing at all until
Dan pastes it across by hand and redeploys.

Committing a change to this folder is not deploying it. A task that changes
`Code.gs` is finished when the paste-and-deploy steps below have been carried
out — not when the commit lands.

## Contents

| File | What it is |
|---|---|
| `Code.gs` | The Web App that `js/sheets.js` talks to. Handles `doGet`, `doPost`, and all reads and writes to the four sheet tabs. |

## Sync state

| | |
|---|---|
| `CODE_VERSION` in this copy | `2026-08-26a` |
| Last synced (repo ← live) | 2026-08-26 — first commit of the reference copy |
| Direction of last sync | live → repo |

Update both rows whenever you paste in either direction. A stale line here is
worse than no line, because it will be believed.

## Checking for drift

The repo copy and the deployed copy can diverge silently, and Google Sheets has
no schema to catch it. To check they match:

1. Open the Web App URL in a browser with `?action=version` on the end.
   The URL is the `SHEET_URL` constant at the top of `js/sheets.js`.
2. You will get back something like `{"code_version":"2026-08-26a"}`.
3. Compare that string to `CODE_VERSION` near the top of `Code.gs` in this
   folder.

**If they match**, the copies are in sync and this one can be trusted.

**If they differ**, the repo copy is stale. Do not design or build against it.
Open the Apps Script editor, copy the live file, and paste it over the copy here
first — then start work.

Worth doing before any task that touches the Sheets schema or `js/sheets.js`.

## Why drift matters here more than it usually would

`Code.gs` writes rows **by position**, using the `COLUMNS` map at the top of the
file. Google Sheets has no column constraints, so a write against the wrong
column order does not fail — it succeeds, and puts the wrong values in the wrong
cells. There is no error, no warning, and no obvious symptom until the data is
read back much later.

That is the failure this folder exists to prevent, and the version ping is the
cheapest way to prevent it.

## Making a change to Code.gs

In order:

1. Check for drift first (above). Resync if needed.
2. Edit `apps-script/Code.gs` here.
3. **Bump `CODE_VERSION`** — same day, add a letter (`2026-08-26a` →
   `2026-08-26b`); a later day, use the new date.
4. If the change adds or moves a column in `COLUMNS`, add the matching header to
   Row 1 of the sheet tab **first**, in the same left-to-right position. A
   column in `COLUMNS` that is missing from Row 1 causes `upsertRow()` to write
   blanks into it.
5. Open the Sheet → Extensions → Apps Script. Select all, paste the new file
   over it, save.
6. **Deploy → Manage deployments → edit the existing deployment.** Do not create
   a new deployment: that issues a new URL, and `SHEET_URL` in `js/sheets.js`
   would then be pointing at the old one.
7. Reload the app and confirm the version ping returns the new string.
8. Update the **Sync state** table above.

## Never put a credential in this folder

This repository is public and git history is permanent — there is no way to
remove something after it has been committed.

`Code.gs` currently contains no credentials, and should stay that way. It
reaches the Sheet with `SpreadsheetApp.getActiveSpreadsheet()`, which works
because the script is bound to the workbook, so it never needs the spreadsheet
ID. Keep it that way.

If a secret is ever genuinely needed — an API key, a shared token, an address —
it goes in **Project Settings → Script Properties** in the Apps Script editor,
and is read at runtime:

```js
var value = PropertiesService.getScriptProperties().getProperty('MY_KEY');
```

Script Properties live in the Apps Script project, never in this repository.

One thing that is *not* a secret and cannot be: the Web App URL in
`js/sheets.js`. It ships to every browser that loads the app. It is fine where
it is.

## If you are considering clasp

`clasp` (`clasp pull` / `clasp push`) would replace the manual paste and turn
drift detection into `git diff`. It is a reasonable future step, not a
prerequisite.

If it is ever set up: `.clasp.json` holds only the script ID and is safe to
commit. `~/.clasprc.json` holds a live OAuth refresh token, lives in the home
directory rather than the project, and must never reach this repository — add it
to `.gitignore` regardless.
