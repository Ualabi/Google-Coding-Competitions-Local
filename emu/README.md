# emu

The local web app for this repo — see the [top-level README](../README.md)
for the full picture. This is a [Next.js](https://nextjs.org) app that
reads the archived problem data from the sibling competition folders
(`../kickstart`, `../codejam`, ...), organized by year and round.

A round's landing page is a dashboard: problems, per-subtask progress, and
your total score, scored the way these competitions actually worked
(partial credit per subtask). Opening a problem gets a split-pane
workspace: statement + analysis on one side, a Monaco code editor on the
other, plus a "Submit" tab — download a subtask's input, run your own
solution against it locally, then upload/paste the output to grade it
against the real answer. Grading is whitespace-normalized exact matching
against the archived `.ans` files (no float tolerance or custom output
validators); scores persist in `localStorage`, not on a server. Hash Code
is different from all of this — it never had an online judge, so its page
is a PDF viewer plus a list of input datasets, each with a button that
reveals the file in the OS's native file explorer (Finder/Explorer/
xdg-open) via a small local API route that shells out — safe here
specifically because this app only ever runs on the reader's own machine.

Nothing here modifies the archived data — it's read-only.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `app/` — routes: `/` (competition picker), `/[competition]` (year/round
  catalog), `/[competition]/[year]/[round]` (the round dashboard),
  `/[competition]/[year]/[round]/[problem]` (the split-pane workspace),
  `/api/statement/...` (statement HTML assets), and
  `/api/testdata/.../[subtask]` (`GET` downloads that subtask's input,
  `POST` grades a submitted output against its answer). Hash Code gets its
  own static routes that take priority over the generic ones:
  `/hashcode/[year]/[round]` (PDF + dataset list), `/api/hashcode/pdf/...`
  (serves the round PDF), and `/api/hashcode/reveal` (the "open dataset"
  action).
- `components/` — `round-dashboard.tsx` (the round landing page),
  `workspace.tsx`/`statement-panel.tsx`/`code-editor-panel.tsx` (the
  split-pane problem view), `submit-panel.tsx` (the grading tab), plus
  `hashcode-dataset-list.tsx` for Hash Code's "open dataset" buttons.
- `lib/catalog.ts` — reads the archive folders on disk and builds the
  year/round/problem catalog, including subtask test data and the judge
  comparison, plus the Hash Code–specific lookups; `lib/competitions.ts`
  holds the static per-competition config (which directory shape each one
  uses, since they're not all alike — see the top-level README's "Project
  structure" section); `lib/progress-store.ts` is the client-side
  `localStorage` layer for submitted scores.
