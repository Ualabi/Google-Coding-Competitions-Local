// Static competition config — no filesystem access here, so this module is
// safe to import from client components. Filesystem-backed lookups
// (getCatalog, getRound, resolveRoundDir) live in lib/catalog.ts instead.

export type CompetitionId =
  | "kickstart"
  | "codejam"
  | "codejam_to_io"
  | "distributed_codejam"
  | "farewell";

export interface RawProblemsConfig {
  // Filenames read directly from the problem folder (no problem_statement/
  // subfolder, no problem.yaml — titles are derived from folder slugs).
  statementFile: string;
  analysisFile: string;
  // Fallback file read (and shown as a wrapped <pre>) when analysisFile is
  // missing, e.g. a commented reference solution instead of a written
  // analysis.
  analysisFallbackFile?: string;
  // Round-slug -> display label, since there's no metadata to derive one
  // from. Anything not listed falls back to a humanized slug.
  roundLabels?: Record<string, string>;
}

export interface CompetitionConfig {
  id: CompetitionId;
  label: string;
  dirName: string;
  // Ad-hoc single/few-problem practice sets filed separately from the
  // numbered rounds, e.g. kickstart/coding_practice/<year>/<round>/<problem>.
  extraPracticeDirName?: string;
  // Round directories are named "<year>_<round>" flat under the
  // competition dir (e.g. distributed_codejam/2016_r1/) instead of nested
  // "<year>/<round>/".
  flatYearRound?: boolean;
  // Present when problems have no problem.yaml/problem_statement — see
  // RawProblemsConfig.
  rawProblems?: RawProblemsConfig;
  // One-off competitions with no year directory at all — rounds sit
  // directly under the competition dir (e.g. farewell/round_a/). The
  // catalog and routes still need a year, so this is the single synthetic
  // value used for it.
  impliedYear?: string;
}

export const COMPETITIONS: Record<CompetitionId, CompetitionConfig> = {
  kickstart: {
    id: "kickstart",
    label: "Kick Start",
    dirName: "kickstart",
    extraPracticeDirName: "coding_practice",
  },
  codejam: {
    id: "codejam",
    label: "Code Jam",
    dirName: "codejam",
  },
  codejam_to_io: {
    id: "codejam_to_io",
    label: "Code Jam to I/O for Women",
    dirName: "codejam_to_io",
  },
  distributed_codejam: {
    id: "distributed_codejam",
    label: "Distributed Code Jam",
    dirName: "distributed_codejam",
    flatYearRound: true,
    rawProblems: {
      statementFile: "statement.html",
      analysisFile: "analysis.html",
      analysisFallbackFile: "solution.cpp",
      roundLabels: {
        online: "Online Round",
        practice: "Practice",
        r1: "Round 1",
        r2: "Round 2",
        finals: "Finals",
      },
    },
  },
  farewell: {
    id: "farewell",
    label: "Farewell Rounds",
    dirName: "farewell",
    impliedYear: "2023",
  },
};

export function isCompetitionId(value: string): value is CompetitionId {
  return value in COMPETITIONS;
}
