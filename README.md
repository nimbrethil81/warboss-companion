# Warboss Companion

<!--
Scope: the brief public entry point for the project—headline capabilities, live links, the current technology summary and navigation to authoritative documentation. Do not add detailed architecture, schemas, future-work lists, release detail or internal procedures here.
Update trigger: update this file when a headline capability, public/live link, technology summary or documentation destination changes.
-->

A web app to guide wargamers through the process of creating their army, playing games and learning from their experiences.

## Project Overview
### Warboss Companion

Your battle-ready companion for Kings of War — from first deployment to final reckoning.

Most wargaming apps are built for list optimisers. Warboss Companion is built for players — the ones who want to spend less time flicking through rulebooks and more time making bold decisions on the table. It guides you through the full arc of a Kings of War game: marshalling your forces, fighting the battle, and learning from what unfolded.

**Four modes. One journey.**

🛡️ **Muster** — Before the battle
Build and save your army. Know your units before the first order is given.

⚔️ **Battle** — During the game
Track turns, manage your roster, and get timely reminders for the rules you'd otherwise forget mid-charge.

📜 **Chronicle** — After the dust settles
Capture what worked, what didn't, and the one thing to try differently next time.

🎯 **Training Ground (beta)** — Between games
Practise rules recall with short multiple-choice questions.

---

Built as a progressive web app — no install required, works in any browser.
Currently supporting Kings of War v4. Free to use.

## Apps

Live: [nimbrethil81.github.io/warboss-companion](https://nimbrethil81.github.io/warboss-companion/)

Development preview: [warboss-companion-dev.nimbrethil81.workers.dev](https://warboss-companion-dev.nimbrethil81.workers.dev/)

The development source repository is private. The live GitHub repository contains only the explicitly approved public files required for the app and this public project information.

## Current Features

- Build and save faction-specific armies with points limits, unit options and magic artefacts.
- Run a game with turn and phase guidance, a saved roster, unit-state tracking and expandable stat/rule cards.
- Record reflections and browse previous games in Chronicle.
- Practise rules recall in the beta Training Ground.
- Install the PWA and use its Battle essentials offline.

## Tech Stack
PWA / Vanilla JS / Google Sheets via Apps Script / Cloudflare Workers Static Assets (development) / GitHub Pages (live)

## Development Process
Solo, iterative, AI-assisted. Detailed specifications, internal workflows and source-only reference material are maintained in the private development repository and are not published with the live app.

## Roadmap

Planned, candidate and deferred work is maintained in `ROADMAP.md` in the private development repository. GitHub Issues are not currently used as a separate backlog.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for concise release history.
