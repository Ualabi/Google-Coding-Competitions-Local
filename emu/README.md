# emu

The local web app for this repo — see the [top-level README](../README.md)
for the full picture. This is a [Next.js](https://nextjs.org) app that
reads the archived problem data from the sibling competition folders
(`../kickstart`, `../codejam`, ...) and serves a split-pane workspace:
problem statement + analysis on one side, a Monaco code editor on the
other, organized by year and round.

Nothing here modifies the archived data — it's read-only.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `app/` — routes: `/` (competition picker), `/[competition]` (year/round
  catalog), `/[competition]/[year]/[round]` (the workspace), plus the
  `/api/statement/...` route that serves statement HTML assets straight
  from the archive folders.
- `components/` — the workspace UI (split pane, statement panel, code
  editor, theme toggle).
- `lib/catalog.ts` — reads the archive folders on disk and builds the
  year/round/problem catalog; `lib/competitions.ts` holds the static
  per-competition config.
