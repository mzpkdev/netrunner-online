# Netrunner Online

A browser-based tabletop for playing Android: Netrunner. Two players connect, paste their deck lists, and play on a shared canvas — dragging cards, placing tokens, and running the game themselves, exactly as they would with physical cardboard. No rules engine, no install, no persistence. See [spec/NORTHPOLE.md](spec/NORTHPOLE.md) for the full product vision.

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- npm (included with Node.js)

## Development

Install dependencies:

```sh
npm install
```

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run serve` | Start the Vite dev server from `src/`    |
| `npm run build` | Production build, output to `dist/`      |
| `npm test`      | Run all Vitest unit tests once           |
