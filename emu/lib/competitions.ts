// Static competition config — no filesystem access here, so this module is
// safe to import from client components. Filesystem-backed lookups
// (getCatalog, getRound, resolveRoundDir) live in lib/catalog.ts instead.

export type CompetitionId = "kickstart" | "codejam";

export interface CompetitionConfig {
  id: CompetitionId;
  label: string;
  dirName: string;
  // Ad-hoc single/few-problem practice sets filed separately from the
  // numbered rounds, e.g. kickstart/coding_practice/<year>/<round>/<problem>.
  extraPracticeDirName?: string;
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
};

export function isCompetitionId(value: string): value is CompetitionId {
  return value in COMPETITIONS;
}
