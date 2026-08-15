# Google Coding Competitions — Local

![Google Coding Competitions Local](docs/banner.jpg)

This is a fork of
[google/coding-competitions-archive](https://github.com/google/coding-competitions-archive),
the official archive of problems from Google's Coding Competitions (Code
Jam, Kick Start, Hash Code, and friends).

The upstream repo is just the raw archived data — problem statements,
analyses, sample data — with no way to browse or actually solve anything.
This fork adds [`emu/`](emu/), a small local web app on top of that data: clone the repo,
run it, and get a split-pane view (problem statement on the left, code
editor on the right) for every problem, organized by year and round, with
no account, server, or internet connection required.

**This is a work in progress and not fully ready yet.** See
[Status](#status) below for what's currently browsable.

## Getting started

```bash
cd emu
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). The app reads
problem data straight out of the competition folders at the repo root — no
separate data setup needed.

## Status

The app currently supports browsing and solving problems from:

- **Kick Start** — all years, including practice rounds
- **Code Jam** — all years, including qualification/regional rounds and
  the 2008 regional semifinals
- **Code Jam to I/O for Women** — all years
- **Distributed Code Jam** — all years, including the 2015 online/practice
  rounds; a few 2018 Finals problems ship a commented reference solution
  instead of a written analysis, and are shown as such

Not wired up yet, but planned:

- Hash Code
- Farewell Rounds

## Project structure

```
.
├── codejam/              archived problem data, inherited from the
├── codejam_to_io/        upstream repo — one folder per competition,
├── distributed_codejam/  each split by year and round
├── farewell/
├── hashcode/
├── kickstart/
│
├── docs/                 contributing guide, code of conduct, this README's assets
│
└── emu/                  the local web app (Next.js) that browses the
                           folders above — see emu/README.md for app-level detail
```

Each problem folder (e.g. `kickstart/2022/round_a/<problem>/`) follows the
same shape: a `problem.yaml` with metadata, a `problem_statement/` with
the HTML statement and analysis, and sample/secret test data. `emu/`
doesn't modify any of this data — it only reads it.

## About the original archive

Problem data for the following contests is included, straight from
upstream:

- Distributed Code Jam
- Code Jam
- Code Jam to I/O for Women
- Hash Code
- Kick Start

The statement and analysis HTML files may have CSS or JS dependencies that
aren't included here. Some of the custom judging code may also have
library dependencies that aren't provided, so it may not run as-is — but
all problem-specific logic is there, which is enough to reproduce the
behavior (and is exactly what `emu/` does for rendering statements).

Some analysis for Distributed Code Jam problems couldn't be included, so a
commented solution was provided instead.

There's no plan (upstream or here) to add data for other contests, like
Code Jam for Europython or local/regional Code Jams.

## License

Apache License 2.0 — see [LICENSE](LICENSE).
