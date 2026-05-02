# Netrunner Online

Browser-based tabletop for Android: Netrunner. See `spec/NORTHPOLE.md` for product vision and `spec/TECHNICAL_VISION.md`
for technical direction.

## CSS — LiteWind

This project uses [LiteWind](https://litewindcss.com/) for utility-first CSS. Class names are Tailwind-compatible.

LLM class reference (fetch when writing or editing HTML with utility classes):
https://raw.githubusercontent.com/html-first-labs/static-tailwind/main/src/classes.txt

## Holographic Card Effect

Cards use a cursor-reactive holographic sheen inspired by https://poke-holo.simey.me/. Reimplement the effect in plain
CSS (custom properties + gradients + mix-blend-mode) with minimal JS for tracking cursor position. No dependencies.

## Tooling Commands

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run serve`     | Start Vite dev server from `src/`                  |
| `npm run build`     | Production build to `dist/`                        |
| `npm test`          | Run all Vitest tests once                          |
| `npm run lint`      | Lint with Biome (no auto-fix)                      |
| `npm run format`    | Format all files with Biome (writes changes)       |
| `npm run check`     | Biome lint + format with auto-fix (writes changes) |
| `npm run typecheck` | Type-check with `tsc --noEmit`                     |
| `npm run verify`    | Run typecheck, lint+format check, and unit tests   |
| `npm run e2e`       | Run Playwright E2E tests (headless)                |

`npm run verify` is the composite fast-validation gate. It intentionally excludes `npm run e2e` because Playwright tests require a running dev server (`npm run serve`) and are too slow for a pre-commit pass. Run `npm run e2e` separately after starting the dev server.

Config files live at the repo root: `tsconfig.json`, `biome.json`, `vitest.config.js`, `playwright.config.js`. All start
permissive and tighten over time per `spec/TECHNICAL_VISION.md`. E2E tests live in `e2e/`.
