# Netrunner Online

A browser-based implementation of Android: Netrunner playable directly in your browser via peer-to-peer networking.

**Live version:** https://mzpkdev.github.io/netrunner-online/

## Prerequisites
- Node.js 20+
- npm

## Setup
```bash
npm ci
```

## Development
```bash
npm run serve   # starts Vite dev server at http://localhost:5173
```

## Build
```bash
npm run build   # outputs production build to dist/
```

## How to Play
1. One player clicks **Host** and shares the displayed Host ID.
2. The other player clicks **Join** and enters that Host ID.
3. Each player selects their side (Corporation / Runner) and pastes their decklist.
4. Click **Load deck** to begin.
