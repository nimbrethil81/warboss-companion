/**
 * Code.gs — Warboss Companion, Google Apps Script backend
 *
 * Deployed as a Google Apps Script Web App (Execute as: Me, Access: Anyone).
 * Acts as a proxy between the client (sheets.js) and the Google Sheet,
 * so no API key is exposed in client-side code.
 *
 * ── THIS FILE IS PUBLIC ──────────────────────────────────────────────────────
 * A reference copy lives at apps-script/Code.gs in the public GitHub repo, and
 * git history is permanent. NEVER put a credential in this file — no API key,
 * no OAuth secret, no spreadsheet ID, no email address. Anything of that kind
 * belongs in Script Properties (Project Settings → Script Properties), read at
 * runtime with PropertiesService.getScriptProperties().getProperty('NAME').
 *
 * The Sheet is reached with SpreadsheetApp.getActiveSpreadsheet(), which works
 * because this script is bound to the workbook. It never needs the Sheet ID.
 *
 * ── SETUP ────────────────────────────────────────────────────────────────────
 * 1. Open the Google Sheet you created for Warboss Companion.
 * 2. Extensions → Apps Script. Paste this file, replacing the default stub.
 * 3. Create four tabs in the Sheet named exactly:
 *      armies    games    game_log    reflections
 *    (Tab names are case-sensitive and must match TABS below.)
 * 4. In each tab, add the column headers listed in COLUMNS below as Row 1,
 *    IN THE SAME LEFT-TO-RIGHT ORDER as COLUMNS lists them. Write operations
 *    place values by position, so the physical column order must match.
 * 5. Deploy → New deployment → Web App.
 *    • Execute as: Me
 *    • Who has access: Anyone
 * 6. Copy the Web App URL and paste it into sheets.js as SHEET_URL.
 * 7. On subsequent code changes: Deploy → Manage deployments → edit the
 *    existing deployment (do NOT create a new one — the URL would change).
 * 8. Bump CODE_VERSION below on every change, BEFORE deploying. See
 *    "── DRIFT DETECTION ──" further down.
 *
 * ── REQUEST CONTRACT ─────────────────────────────────────────────────────────
 * GET  ?tab=<tab>[&filterField=<col>&filterValue=<val>]
 *   Returns: JSON array of row objects (one object per non-header row).
 *   If filterField/filterValue are provided, only matching rows are returned.
 *
 * GET  ?action=version
 *   Returns: { code_version: "<CODE_VERSION>" }. Takes no tab parameter.
 *
 * POST body: { action, tab, record? (object), records? (array), id?, idField? }
 *   action = "insert"     → append one record          (body: record)
 *   action = "insertMany" → append multiple records    (body: records[])
 *   action = "upsert"     → insert or update by ID col (body: record)
 *   action = "delete"     → delete first row matching  (body: id, idField)
 *   Returns: { success: true } or { success: false, error: "..." }
 *
 * ── DRIFT DETECTION ──────────────────────────────────────────────────────────
 * The copy of this file in the repo is NOT the code that runs. The running
 * copy is whatever was last pasted into the Apps Script editor and deployed.
 * To check whether they match, open the Web App URL with ?action=version and
 * compare the string returned against CODE_VERSION in the repo copy. If they
 * differ, the repo copy is stale — do not design against it until it is
 * resynced. See apps-script/README.md.
 *
 * ── WAYS OF WORKING ──────────────────────────────────────────────────────────
 * Fail Gracefully   : all handlers are wrapped in try/catch; errors are
 *                     returned as JSON, not thrown as HTML error pages.
 * Single Source of Truth: column definitions live in COLUMNS below; no
 *                     column name appears more than once in this file.
 * No Magic Numbers  : tab names and ID columns live in named constants.
 */

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

/**
 * Version stamp for drift detection between this file and the deployed copy.
 *
 * Format: YYYY-MM-DD plus a letter for a second change on the same day
 * ('2026-08-26a', then '2026-08-26b'). Bump it on EVERY change to this file,
 * before deploying, and keep the repo copy identical.
 *
 * Read it back at any time with:  <Web App URL>?action=version
 */
var CODE_VERSION = '2026-08-26a';

/** Tab names must exactly match the tabs in the Google Sheet. */
var TABS = {
  ARMIES:      'armies',
  GAMES:       'games',
  GAME_LOG:    'game_log',
  REFLECTIONS: 'reflections',
};

/**
 * Column headers for each tab, in order.
 * These must match the headers in Row 1 of each sheet tab — INCLUDING their
 * left-to-right order, because appendRow()/upsertRow() write values by
 * position. The first column in each tab is the primary key used for upsert.
 *
 * NOTE (armies tail columns): `faction_id` and `pts_limit` are the two
 * rightmost columns of `armies`, in that order, immediately after
 * `updated_at`. Both were added after the tab was first created, each
 * appended to the right-hand end. If either is ever moved, reorder this array
 * to match the sheet exactly, or writes will land in the wrong columns.
 *
 * Rows created before a column existed simply hold a blank cell there; the
 * client normalises a missing `faction_id` to the default faction and a
 * missing `pts_limit` to its default limit, so no backfill is required.
 */
var COLUMNS = {
  armies: [
    'army_id', 'army_name', 'game_system', 'units',
    'created_at', 'updated_at', 'faction_id', 'pts_limit',
  ],
  games: [
    'game_id', 'date', 'army_id', 'opponent_army',
    'result', 'turns_played', 'notes',
  ],
  game_log: [
    'log_id', 'game_id', 'turn_number', 'phase', 'note',
  ],
  reflections: [
    'reflection_id', 'game_id',
    'what_worked', 'what_didnt', 'next_time',
    'created_at',
  ],
};

/** Primary key column for upsert operations (first column in each tab). */
var ID_COLUMNS = {
  armies:      'army_id',
  games:       'game_id',
  game_log:    'log_id',
  reflections: 'reflection_id',
};

// ─── CORS HEADERS ─────────────────────────────────────────────────────────────

/**
 * Attach permissive CORS headers so the GitHub Pages origin can call this
 * endpoint. Apps Script Web Apps require CORS to be set on every response.
 *
 * @param {GoogleAppsScript.Content.TextOutput} output
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function setCorsHeaders(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON);
  // Apps Script automatically adds Access-Control-Allow-Origin: *
  // for Web Apps deployed as "Anyone can access".
}

/** Build a JSON success response. */
function jsonOk(data) {
  return setCorsHeaders(
    ContentService.createTextOutput(JSON.stringify(data))
  );
}

/** Build a JSON error response. Always HTTP 200 so the client can parse it. */
function jsonError(message) {
  return setCorsHeaders(
    ContentService.createTextOutput(
      JSON.stringify({ success: false, error: message })
    )
  );
}

// ─── SHEET HELPERS ────────────────────────────────────────────────────────────

/**
 * Return the Sheet object for a given tab name.
 * Throws if the tab does not exist — caught by the outer try/catch.
 *
 * @param {string} tabName
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(tabName) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    throw new Error('Sheet tab not found: ' + tabName);
  }
  return sheet;
}

/**
 * Read all data rows from a sheet and return them as an array of objects.
 * Row 1 is assumed to be the header row.
 *
 * @param {string} tabName
 * @returns {Array<Object>}
 */
function readRows(tabName) {
  var sheet = getSheet(tabName);
  var data  = sheet.getDataRange().getValues();

  if (data.length < 2) return []; // header only — no data rows

  var headers = data[0];
  return data.slice(1).map(function (row) {
    var obj = {};
    headers.forEach(function (header, i) {
      obj[header] = row[i];
    });
    return obj;
  });
}

/**
 * Append a single record to a sheet.
 * Column order is determined by COLUMNS[tabName], so any missing fields
 * are written as empty strings rather than shifting remaining values.
 *
 * @param {string} tabName
 * @param {Object} record
 */
function appendRow(tabName, record) {
  var sheet   = getSheet(tabName);
  var columns = COLUMNS[tabName];
  var row     = columns.map(function (col) {
    var val = record[col];
    return (val !== undefined && val !== null) ? val : '';
  });
  sheet.appendRow(row);
}

/**
 * Upsert a record: update the existing row if the ID column matches,
 * otherwise append a new row.
 *
 * A field absent from the record keeps whatever the sheet already holds in
 * that column, so a partial update never blanks a column it did not mention.
 * That fallback reads the existing row BY HEADER NAME — so a column listed in
 * COLUMNS but missing from Row 1 of the sheet would resolve to index -1 and
 * write an empty cell. Adding a column to COLUMNS therefore always means
 * adding the matching header to the sheet first.
 *
 * @param {string} tabName
 * @param {Object} record
 */
function upsertRow(tabName, record) {
  var sheet   = getSheet(tabName);
  var columns = COLUMNS[tabName];
  var idCol   = ID_COLUMNS[tabName];
  var idValue = record[idCol];

  if (!idValue) {
    // No ID provided — treat as a plain insert
    appendRow(tabName, record);
    return;
  }

  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf(idCol);

  if (idIndex === -1) {
    throw new Error('ID column "' + idCol + '" not found in tab "' + tabName + '"');
  }

  // Search existing rows for a matching ID
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(idValue)) {
      // Found — update this row in place
      var updatedRow = columns.map(function (col) {
        var val = record[col];
        if (val !== undefined && val !== null) return val;
        var existingIdx = headers.indexOf(col);
        return existingIdx === -1 ? '' : data[i][existingIdx];
      });
      sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
      return;
    }
  }

  // Not found — append as a new row
  appendRow(tabName, record);
}

/**
 * Delete a row from a sheet by matching a field value.
 * Deletes the first matching row only. If no row matches, does nothing.
 *
 * @param {string} tabName
 * @param {string} idField  — column name to match against (e.g. 'army_id')
 * @param {string} idValue  — value to match
 */
function deleteRow(tabName, idField, idValue) {
  var sheet   = getSheet(tabName);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var colIdx  = headers.indexOf(idField);

  if (colIdx === -1) {
    throw new Error('Column "' + idField + '" not found in tab "' + tabName + '"');
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]) === String(idValue)) {
      sheet.deleteRow(i + 1); // +1 because sheet rows are 1-indexed
      return;
    }
  }
  // No matching row — not an error; treat as already deleted (idempotent)
}

// ─── GET HANDLER ─────────────────────────────────────────────────────────────

/**
 * Handle GET requests.
 * Routes:
 *   GET ?action=version                                    → version ping
 *   GET ?tab=<tab>[&filterField=<col>&filterValue=<val>]   → rows
 *
 * The version ping is checked first and takes no tab parameter, so it cannot
 * interfere with a data read.
 *
 * @param {Object} e — Apps Script event object
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  try {
    var params      = e.parameter || {};
    var tabName     = params.tab;
    var filterField = params.filterField || null;
    var filterValue = params.filterValue || null;

    /* Drift-detection ping. Deliberately answered before any tab handling so
       it works with no other parameters: <Web App URL>?action=version */
    if (params.action === 'version') {
      return jsonOk({ code_version: CODE_VERSION });
    }

    if (!tabName) {
      return jsonError('Missing required parameter: tab');
    }

    if (!COLUMNS[tabName]) {
      return jsonError('Unknown tab: ' + tabName);
    }

    var rows = readRows(tabName);

    if (filterField && filterValue !== null) {
      rows = rows.filter(function (row) {
        return String(row[filterField]) === String(filterValue);
      });
    }

    return jsonOk(rows);

  } catch (err) {
    console.error('doGet error:', err);
    return jsonError('GET failed: ' + err.message);
  }
}

// ─── POST HANDLER ────────────────────────────────────────────────────────────

/**
 * Handle POST requests.
 * Body: { action, tab, record?, records? }
 *
 * action = "insert"     — append one record
 * action = "insertMany" — append multiple records
 * action = "upsert"     — insert or update by primary key
 * action = "delete"     — delete the first row matching idField/id
 *
 * @param {Object} e — Apps Script event object
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonError('Invalid JSON in request body');
    }

    var action  = payload.action;
    var tabName = payload.tab;

    if (!action || !tabName) {
      return jsonError('Missing required fields: action, tab');
    }

    if (!COLUMNS[tabName]) {
      return jsonError('Unknown tab: ' + tabName);
    }

    if (action === 'insert') {
      if (!payload.record) {
        return jsonError('Missing field: record');
      }
      appendRow(tabName, payload.record);
      return jsonOk({ success: true });
    }

    if (action === 'insertMany') {
      if (!Array.isArray(payload.records) || payload.records.length === 0) {
        return jsonError('Missing or empty field: records');
      }
      payload.records.forEach(function (record) {
        appendRow(tabName, record);
      });
      return jsonOk({ success: true });
    }

    if (action === 'upsert') {
      if (!payload.record) {
        return jsonError('Missing field: record');
      }
      upsertRow(tabName, payload.record);
      return jsonOk({ success: true });
    }

    if (action === 'delete') {
      var idField = payload.idField;
      var idValue = payload.id;
      if (!idField || idValue === undefined || idValue === null) {
        return jsonError('Missing fields: id, idField');
      }
      deleteRow(tabName, idField, String(idValue));
      return jsonOk({ success: true });
    }

    return jsonError('Unknown action: ' + action);

  } catch (err) {
    console.error('doPost error:', err);
    return jsonError('POST failed: ' + err.message);
  }
}