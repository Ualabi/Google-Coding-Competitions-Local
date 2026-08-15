# emu

The local web app for this repo — see the [top-level README](../README.md)
for the full picture. This is a [Next.js](https://nextjs.org) app that
reads the archived problem data from the sibling competition folders
(`../kickstart`, `../codejam`, ...), organized by year and round.

Most competitions get a split-pane workspace: problem statement + analysis
on one side, a Monaco code editor on the other. Hash Code is different — it
never had an online judge, so its page is a PDF viewer plus a list of
input datasets, each with a button that reveals the file in the OS's
native file explorer (Finder/Explorer/xdg-open) via a small local API
route that shells out — safe here specifically because this app only ever
runs on the reader's own machine.

Nothing here modifies the archived data — it's read-only.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `app/` — routes: `/` (competition picker), `/[competition]` (year/round
  catalog), `/[competition]/[year]/[round]` (the split-pane workspace),
  plus `/api/statement/...` (serves statement HTML assets). Hash Code gets
  its own static routes that take priority over the generic ones:
  `/hashcode/[year]/[round]` (PDF + dataset list), `/api/hashcode/pdf/...`
  (serves the round PDF), and `/api/hashcode/reveal` (the "open dataset"
  action).
- `components/` — the workspace UI (split pane, statement panel, code
  editor, theme toggle) plus `hashcode-dataset-list.tsx` for Hash Code's
  "open dataset" buttons.
- `lib/catalog.ts` — reads the archive folders on disk and builds the
  year/round/problem catalog, including the Hash Code–specific lookups;
  `lib/competitions.ts` holds the static per-competition config (which
  directory shape each one uses, since they're not all alike — see the
  top-level README's "Project structure" section).
