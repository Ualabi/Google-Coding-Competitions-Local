import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { COMPETITIONS, type CompetitionId } from "@/lib/competitions";
import { buildStarterCode, type Language } from "@/lib/starter-code";

export type { CompetitionId } from "@/lib/competitions";
export { COMPETITIONS, isCompetitionId } from "@/lib/competitions";

// Kept outside the Next.js project root on purpose: this directory is ~3GB+
// of archived contest data, and Turbopack's dev-mode file watcher chokes for
// a minute+ on first compile if a directory that size sits inside the
// watched project tree. Point PROBLEMS_ROOT_DIR at wherever it actually
// lives — it should contain one subdirectory per competition (kickstart/,
// codejam/, ...).
export const PROBLEMS_ROOT_DIR =
  process.env.PROBLEMS_ROOT_DIR ?? path.join(process.cwd(), "..");

const SLUG_PATTERN = /^[a-z0-9_-]+$/i;
const YEAR_PATTERN = /^\d{4}$/;

// Known contest rounds, in display order. Anything not listed here (and not
// practice) sorts alphabetically after these; practice rounds always sort
// last, alphabetically — see sortRoundSlugs.
const ROUND_ORDER = [
  "round_a",
  "round_b",
  "round_c",
  "round_d",
  "round_e",
  "round_f",
  "round_g",
  "round_h",
  "qualification_round",
  "round_1a",
  "round_1b",
  "round_1c",
  "amer_semifinal",
  "apac_semifinal",
  "emea_semifinal",
  "round_2",
  "round_3",
  "world_finals",
  "virtual_world_finals",
];

export interface ProblemSummary {
  slug: string;
  title: string;
}

export interface RoundSummary {
  slug: string;
  title: string;
  isPractice: boolean;
  problems: ProblemSummary[];
}

export interface YearEntry {
  year: string;
  rounds: RoundSummary[];
}

export interface ProblemData extends ProblemSummary {
  problemHtml: string;
  analysisHtml: string;
  starterCode: Record<Language, string>;
}

export interface RoundData {
  year: string;
  slug: string;
  title: string;
  problems: ProblemData[];
}

function parseYamlField(content: string, key: string): string {
  const match = content.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : "";
}

function titleFromSource(source: string): string {
  const parts = source.split(" - ");
  const title = parts[parts.length - 1]?.trim() || source;
  return title
    .replace(
      /^Coding Practice with Kick Start Session #(\d+)$/,
      "Practice Round #$1",
    )
    .replace(/^Coding Practice with Kick Start$/, "Practice Round");
}

function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value) && !value.includes("..");
}

function isPracticeSlug(roundSlug: string): boolean {
  return roundSlug.includes("practice");
}

async function listDirs(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function listDirsSafe(dir: string): Promise<string[]> {
  try {
    return await listDirs(dir);
  } catch {
    return [];
  }
}

function sortRoundSlugs(slugs: string[]): string[] {
  const main = slugs.filter((s) => !isPracticeSlug(s));
  const practice = slugs.filter(isPracticeSlug).sort();

  main.sort((a, b) => {
    const rankA = ROUND_ORDER.indexOf(a);
    const rankB = ROUND_ORDER.indexOf(b);
    if (rankA === -1 && rankB === -1) return a.localeCompare(b);
    if (rankA === -1) return 1;
    if (rankB === -1) return -1;
    return rankA - rankB;
  });

  return [...main, ...practice];
}

function competitionDir(competition: CompetitionId): string {
  return path.join(PROBLEMS_ROOT_DIR, COMPETITIONS[competition].dirName);
}

// Round directories can live either directly under a year (numbered rounds)
// or under the extra practice tree (ad-hoc practice sets) — try both.
function roundBaseDirs(competition: CompetitionId, year: string): string[] {
  const base = competitionDir(competition);
  const extra = COMPETITIONS[competition].extraPracticeDirName;
  return extra
    ? [path.join(base, year), path.join(base, extra, year)]
    : [path.join(base, year)];
}

export async function resolveRoundDir(
  competition: CompetitionId,
  year: string,
  roundSlug: string,
): Promise<string | null> {
  for (const baseDir of roundBaseDirs(competition, year)) {
    const candidate = path.join(baseDir, roundSlug);
    try {
      if ((await stat(candidate)).isDirectory()) return candidate;
    } catch {
      // try the next base dir
    }
  }
  return null;
}

async function readProblemSummary(
  roundDir: string,
  problemSlug: string,
): Promise<ProblemSummary> {
  const yamlPath = path.join(roundDir, problemSlug, "problem.yaml");
  const yaml = await readFile(yamlPath, "utf-8");
  return {
    slug: problemSlug,
    title: parseYamlField(yaml, "name") || problemSlug,
  };
}

async function readRoundSummary(
  competition: CompetitionId,
  year: string,
  roundSlug: string,
): Promise<RoundSummary> {
  const roundDir = await resolveRoundDir(competition, year, roundSlug);
  if (!roundDir) {
    return { slug: roundSlug, title: roundSlug, isPractice: true, problems: [] };
  }

  const problemSlugs = (await listDirs(roundDir)).filter(isValidSlug);

  const problems = await Promise.all(
    problemSlugs.map((slug) => readProblemSummary(roundDir, slug)),
  );
  problems.sort((a, b) => a.title.localeCompare(b.title));

  let title = roundSlug;
  if (problems.length > 0) {
    const yamlPath = path.join(
      roundDir,
      problems[0].slug,
      "problem.yaml",
    );
    const yaml = await readFile(yamlPath, "utf-8");
    const source = parseYamlField(yaml, "source");
    if (source) title = titleFromSource(source);
  }

  return {
    slug: roundSlug,
    title,
    isPractice: isPracticeSlug(roundSlug),
    problems,
  };
}

export const getCatalog = cache(
  async (competition: CompetitionId): Promise<YearEntry[]> => {
    const base = competitionDir(competition);
    const extra = COMPETITIONS[competition].extraPracticeDirName;

    const mainYearDirs = await listDirsSafe(base);
    const extraYearDirs = extra
      ? await listDirsSafe(path.join(base, extra))
      : [];
    const yearDirs = [...new Set([...mainYearDirs, ...extraYearDirs])]
      .filter((y) => YEAR_PATTERN.test(y))
      .sort()
      .reverse();

    const years = await Promise.all(
      yearDirs.map(async (year) => {
        const roundSlugLists = await Promise.all(
          roundBaseDirs(competition, year).map((baseDir) =>
            listDirsSafe(baseDir),
          ),
        );
        const roundSlugs = sortRoundSlugs(
          [...new Set(roundSlugLists.flat())].filter(isValidSlug),
        );
        const rounds = await Promise.all(
          roundSlugs.map((slug) => readRoundSummary(competition, year, slug)),
        );
        return { year, rounds };
      }),
    );

    return years;
  },
);

export const getRound = cache(
  async (
    competition: CompetitionId,
    year: string,
    roundSlug: string,
  ): Promise<RoundData | null> => {
    if (!YEAR_PATTERN.test(year) || !isValidSlug(roundSlug)) return null;

    const roundDir = await resolveRoundDir(competition, year, roundSlug);
    if (!roundDir) return null;

    let problemSlugs: string[];
    try {
      problemSlugs = (await listDirs(roundDir)).filter(isValidSlug);
    } catch {
      return null;
    }
    if (problemSlugs.length === 0) return null;

    const sources = new Map<string, string>();

    const problems: ProblemData[] = await Promise.all(
      problemSlugs.map(async (slug) => {
        const problemDir = path.join(roundDir, slug);
        const [yaml, problemHtml, analysisHtml] = await Promise.all([
          readFile(path.join(problemDir, "problem.yaml"), "utf-8"),
          readFile(
            path.join(problemDir, "problem_statement", "problem.html"),
            "utf-8",
          ),
          readFile(
            path.join(problemDir, "problem_statement", "analysis.html"),
            "utf-8",
          ),
        ]);
        const title = parseYamlField(yaml, "name") || slug;
        sources.set(slug, parseYamlField(yaml, "source"));

        return {
          slug,
          title,
          problemHtml,
          analysisHtml,
          starterCode: {
            cpp: buildStarterCode(title, "cpp"),
            python: buildStarterCode(title, "python"),
          } satisfies Record<Language, string>,
        };
      }),
    );

    problems.sort((a, b) => a.title.localeCompare(b.title));
    const firstSource = problems[0] && sources.get(problems[0].slug);
    const title = firstSource ? titleFromSource(firstSource) : roundSlug;

    return { year, slug: roundSlug, title, problems };
  },
);
