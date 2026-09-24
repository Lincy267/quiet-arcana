# Quiet Arcana

Quiet Arcana is a Chinese-language, local-first tarot reading web app. It runs as a static site with no build step, account, backend, or AI service. Readings are for reflection, not certain prediction.

## Features

- Built-in one-, three-, and five-card readings, a Relationship spread, and the Celtic Cross.
- A visual custom spread builder for 1–15 positions, including spatial layouts.
- A cryptographically randomized shuffle and independently assigned upright or reversed orientation.
- Local reference meanings for all 78 cards.
- Optional, explicitly saved reading History and Reality Comparisons for recording later events alongside frozen reading snapshots.
- Local JSON Backup & Restore for saved custom spreads, History, and Reality Comparisons.

## Run locally

Serve this directory with any static HTTP server, then open its local URL in a modern browser. For example, if Python 3 is installed:

```sh
python3 -m http.server 8000
```

Visit `http://127.0.0.1:8000/`. The app needs no package installation, build system, or server-side code. Use an HTTP server rather than opening `index.html` as a `file://` page.

## Privacy and data portability

Tarot questions are processed in the browser. Quiet Arcana has no account, backend, API calls, analytics, or tracking. Saving a reading is optional; saved readings, comparisons, and custom spreads remain in that browser's `localStorage`. They do not automatically sync between browsers or devices.

Use **数据管理 → 导出本地备份** to download a JSON copy of saved data. **恢复备份** validates a selected backup and replaces the three saved collections after confirmation; it does not merge them. Keep your own backup before clearing browser data or changing devices. An unsaved reading is not included in a backup.

If GitHub Pages is enabled later, it will serve the same static files; it will not store your questions or readings.

## Randomness

The app uses `crypto.getRandomValues()` with rejection sampling to avoid modulo bias. A Fisher–Yates shuffle creates a locked deck for each reading, and each card's upright/reversed orientation is generated independently. Choosing a card back reveals the corresponding card from that already shuffled deck.

## Artwork

Rider–Waite–Smith artwork by Pamela Colman Smith (1910). Images sourced from Wikimedia Commons. The original artwork is public domain; Quiet Arcana does not claim to have created or own it.

## Status

Quiet Arcana is a static, local-first project preparing for its first repository publication. GitHub Pages hosting and offline PWA support are not configured yet.
