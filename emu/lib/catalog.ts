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
const FLAT_YEAR_ROUND_PATTERN = /^(\d{4})_([a-z0-9_-]+)$/i;
const HASHCODE_ROUND_SLUGS = ["qualification_round", "final_round"] as const;
const HASHCODE_DIR_PATTERN = /^hashcode_(\d{4})_(qualification_round|final_round)$/;
const HASHCODE_DATASET_EXTENSIONS = [".in.txt", ".in", ".txt"];

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
  "online",
  "round_1a",
  "round_1b",
  "round_1c",
  "r1",
  "amer_semifinal",
  "apac_semifinal",
  "emea_semifinal",
  "final_round",
  "round_2",
  "r2",
  "round_3",
  "world_finals",
  "virtual_world_finals",
  "finals",
];

export interface SubtaskInfo {
  id: number;
  acceptScore: number;
}

export interface ProblemTestData {
  subtasks: SubtaskInfo[];
  totalScore: number;
}

export interface ProblemSummary {
  slug: string;
  title: string;
  // null for problems with no static secret test data to grade against —
  // e.g. Distributed Code Jam (no data/ at all) or interactive-judge
  // problems (custom validator, no fixed .ans to compare against).
  testData: ProblemTestData | null;
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

// Used for competitions with no problem.yaml to read a title from, e.g.
// "toothpick_sculpture" -> "Toothpick Sculpture".
function humanizeSlug(slug: string): string {
  return slug
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

async function listFilesSafe(dir: string): Promise<string[]> {
  try {
    return await listFiles(dir);
  } catch {
    return [];
  }
}

function hashcodeRoundDirName(year: string, roundSlug: string): string {
  return `hashcode_${year}_${roundSlug}`;
}

// Hash Code dataset filenames vary by year ("a_example.in", "kittens.in.txt",
// "paris_54000.txt", ...) but from 2016 on they consistently start with a
// problem letter, e.g. "b_by_the_ocean.in.txt" -> "By The Ocean". Older
// single-dataset rounds (2014/2015) don't follow that shape at all.
function humanizeDatasetFilename(filename: string): string {
  let base = filename;
  for (const ext of HASHCODE_DATASET_EXTENSIONS) {
    if (base.toLowerCase().endsWith(ext)) {
      base = base.slice(0, -ext.length);
      break;
    }
  }
  const match = base.match(/^[a-z]_(.+)$/i);
  return match ? humanizeSlug(match[1]) : "Dataset";
}

async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return null;
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

// Easiest first: total possible points is a reasonable proxy for difficulty
// (these competitions consistently weight harder problems higher). Problems
// with no test data to score (no judge data at all) sort last, since there's
// no signal to rank them by.
function sortProblemsByDifficulty<T extends { title: string; testData: ProblemTestData | null }>(
  problems: T[],
): T[] {
  return [...problems].sort((a, b) => {
    const scoreA = a.testData?.totalScore;
    const scoreB = b.testData?.totalScore;
    if (scoreA == null && scoreB == null) return a.title.localeCompare(b.title);
    if (scoreA == null) return 1;
    if (scoreB == null) return -1;
    return scoreA - scoreB || a.title.localeCompare(b.title);
  });
}

function competitionDir(competition: CompetitionId): string {
  return path.join(PROBLEMS_ROOT_DIR, COMPETITIONS[competition].dirName);
}

function roundTitle(competition: CompetitionId, roundSlug: string): string {
  return (
    COMPETITIONS[competition].rawProblems?.roundLabels?.[roundSlug] ??
    humanizeSlug(roundSlug)
  );
}

// Round directories can live either directly under a year (numbered rounds)
// or under the extra practice tree (ad-hoc practice sets) — try both. Not
// used for flatYearRound competitions, which resolve directly instead.
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
  const cfg = COMPETITIONS[competition];

  if (cfg.impliedYear) {
    if (year !== cfg.impliedYear) return null;
    const candidate = path.join(competitionDir(competition), roundSlug);
    try {
      if ((await stat(candidate)).isDirectory()) return candidate;
    } catch {
      // fall through to null below
    }
    return null;
  }

  const candidates = cfg.flatYearRound
    ? [path.join(competitionDir(competition), `${year}_${roundSlug}`)]
    : roundBaseDirs(competition, year).map((baseDir) =>
        path.join(baseDir, roundSlug),
      );

  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isDirectory()) return candidate;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

// Where a problem's statement/analysis assets (images etc.) are served
// from — a problem_statement/ subfolder normally, or the problem folder
// itself for rawProblems competitions.
export function problemAssetDir(
  competition: CompetitionId,
  roundDir: string,
  problemSlug: string,
): string {
  const problemDir = path.join(roundDir, problemSlug);
  return COMPETITIONS[competition].rawProblems
    ? problemDir
    : path.join(problemDir, "problem_statement");
}

const SUBTASK_DIR_PATTERN = /^subtask(\d+)$/;

// Reads a problem's graded test data straight from data/secret/subtask*/
// testdata.yaml (accept_score per subtask) — competitions without a data/
// folder at all (Distributed Code Jam) or without secret subtasks
// (interactive-judge problems) simply have nothing to read, so this
// returns null rather than throwing.
async function readProblemTestData(
  roundDir: string,
  problemSlug: string,
): Promise<ProblemTestData | null> {
  const secretDir = path.join(roundDir, problemSlug, "data", "secret");
  const entries = await listDirsSafe(secretDir);
  const subtaskDirs = entries.filter((e) => SUBTASK_DIR_PATTERN.test(e));
  if (subtaskDirs.length === 0) return null;

  const subtasks = (
    await Promise.all(
      subtaskDirs.map(async (dirName) => {
        const id = Number(dirName.match(SUBTASK_DIR_PATTERN)![1]);
        const yaml = await readFileSafe(
          path.join(secretDir, dirName, "testdata.yaml"),
        );
        const acceptScore = yaml ? Number(parseYamlField(yaml, "accept_score")) : NaN;
        return { id, acceptScore };
      }),
    )
  )
    .filter((s): s is SubtaskInfo => Number.isFinite(s.acceptScore))
    .sort((a, b) => a.id - b.id);

  if (subtasks.length === 0) return null;

  return {
    subtasks,
    totalScore: subtasks.reduce((sum, s) => sum + s.acceptScore, 0),
  };
}

function subtaskDir(
  roundDir: string,
  problemSlug: string,
  subtaskId: number,
): string {
  return path.join(roundDir, problemSlug, "data", "secret", `subtask${subtaskId}`);
}

// Validates (competition, year, round, problem, subtask) against the real
// on-disk test data before resolving a path — reused by both the input
// download route and the judge endpoint, so neither can be pointed at an
// arbitrary file.
async function resolveSubtask(
  competition: CompetitionId,
  year: string,
  roundSlug: string,
  problemSlug: string,
  subtaskId: number,
): Promise<{ roundDir: string; subtask: SubtaskInfo } | null> {
  const roundDir = await resolveRoundDir(competition, year, roundSlug);
  if (!roundDir) return null;
  const testData = await readProblemTestData(roundDir, problemSlug);
  const subtask = testData?.subtasks.find((s) => s.id === subtaskId);
  return subtask ? { roundDir, subtask } : null;
}

export async function resolveSubtaskInputPath(
  competition: CompetitionId,
  year: string,
  roundSlug: string,
  problemSlug: string,
  subtaskId: number,
): Promise<string | null> {
  const resolved = await resolveSubtask(
    competition,
    year,
    roundSlug,
    problemSlug,
    subtaskId,
  );
  if (!resolved) return null;
  return path.join(
    subtaskDir(resolved.roundDir, problemSlug, subtaskId),
    "1.in",
  );
}

// Competitive-judge-style comparison: whitespace-normalized token equality,
// so extra spaces/blank lines/line-ending differences don't matter but the
// actual values do — matches how the real judges compared submissions.
function normalizedTokens(text: string): string {
  return text.trim().split(/\s+/).filter(Boolean).join(" ");
}

export interface JudgeResult {
  correct: boolean;
  acceptScore: number;
}

export async function judgeSubtaskOutput(
  competition: CompetitionId,
  year: string,
  roundSlug: string,
  problemSlug: string,
  subtaskId: number,
  submittedOutput: string,
): Promise<JudgeResult | null> {
  const resolved = await resolveSubtask(
    competition,
    year,
    roundSlug,
    problemSlug,
    subtaskId,
  );
  if (!resolved) return null;

  const expected = await readFileSafe(
    path.join(subtaskDir(resolved.roundDir, problemSlug, subtaskId), "1.ans"),
  );
  if (expected === null) return null;

  return {
    correct: normalizedTokens(expected) === normalizedTokens(submittedOutput),
    acceptScore: resolved.subtask.acceptScore,
  };
}

async function readProblemSummary(
  competition: CompetitionId,
  roundDir: string,
  problemSlug: string,
): Promise<ProblemSummary> {
  if (COMPETITIONS[competition].rawProblems) {
    // Distributed Code Jam: no data/ folder, so nothing to grade.
    return { slug: problemSlug, title: humanizeSlug(problemSlug), testData: null };
  }
  const [yaml, testData] = await Promise.all([
    readFile(path.join(roundDir, problemSlug, "problem.yaml"), "utf-8"),
    readProblemTestData(roundDir, problemSlug),
  ]);
  return {
    slug: problemSlug,
    title: parseYamlField(yaml, "name") || problemSlug,
    testData,
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
    problemSlugs.map((slug) => readProblemSummary(competition, roundDir, slug)),
  );
  problems.sort((a, b) => a.title.localeCompare(b.title));

  const rawProblems = COMPETITIONS[competition].rawProblems;
  let title = rawProblems ? roundTitle(competition, roundSlug) : roundSlug;
  if (!rawProblems && problems.length > 0) {
    const yamlPath = path.join(roundDir, problems[0].slug, "problem.yaml");
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
    const cfg = COMPETITIONS[competition];

    if (cfg.hashcode) {
      const roundDirsByYear = new Map<string, string[]>();
      for (const entry of await listDirsSafe(base)) {
        const match = entry.match(HASHCODE_DIR_PATTERN);
        if (!match) continue;
        const [, year, roundSlug] = match;
        const existing = roundDirsByYear.get(year);
        if (existing) existing.push(roundSlug);
        else roundDirsByYear.set(year, [roundSlug]);
      }

      const years = [...roundDirsByYear.keys()].sort().reverse();
      return Promise.all(
        years.map(async (year) => {
          const roundSlugs = sortRoundSlugs(roundDirsByYear.get(year)!);
          const rounds = await Promise.all(
            roundSlugs.map(async (roundSlug) => {
              const files = await listFilesSafe(
                path.join(base, hashcodeRoundDirName(year, roundSlug)),
              );
              const problems = files.map((filename) => ({
                slug: filename,
                title: humanizeDatasetFilename(filename),
                // Hash Code has its own separate PDF + dataset workflow,
                // not the subtask-based grading the other competitions use.
                testData: null,
              }));
              return {
                slug: roundSlug,
                title: humanizeSlug(roundSlug),
                isPractice: false,
                problems,
              };
            }),
          );
          return { year, rounds };
        }),
      );
    }

    if (cfg.impliedYear) {
      const roundSlugs = sortRoundSlugs(
        (await listDirsSafe(base)).filter(isValidSlug),
      );
      if (roundSlugs.length === 0) return [];
      const rounds = await Promise.all(
        roundSlugs.map((slug) =>
          readRoundSummary(competition, cfg.impliedYear!, slug),
        ),
      );
      return [{ year: cfg.impliedYear, rounds }];
    }

    if (cfg.flatYearRound) {
      const entries = await listDirsSafe(base);
      const roundSlugsByYear = new Map<string, string[]>();
      for (const entry of entries) {
        const match = entry.match(FLAT_YEAR_ROUND_PATTERN);
        if (!match) continue;
        const [, year, roundSlug] = match;
        if (!isValidSlug(roundSlug)) continue;
        const existing = roundSlugsByYear.get(year);
        if (existing) existing.push(roundSlug);
        else roundSlugsByYear.set(year, [roundSlug]);
      }

      const years = [...roundSlugsByYear.keys()].sort().reverse();
      return Promise.all(
        years.map(async (year) => {
          const roundSlugs = sortRoundSlugs(roundSlugsByYear.get(year)!);
          const rounds = await Promise.all(
            roundSlugs.map((slug) => readRoundSummary(competition, year, slug)),
          );
          return { year, rounds };
        }),
      );
    }

    const extra = cfg.extraPracticeDirName;
    const mainYearDirs = await listDirsSafe(base);
    const extraYearDirs = extra
      ? await listDirsSafe(path.join(base, extra))
      : [];
    const yearDirs = [...new Set([...mainYearDirs, ...extraYearDirs])]
      .filter((y) => YEAR_PATTERN.test(y))
      .sort()
      .reverse();

    return Promise.all(
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

    const rawProblems = COMPETITIONS[competition].rawProblems;

    if (rawProblems) {
      const problems: ProblemData[] = await Promise.all(
        problemSlugs.map(async (slug) => {
          const problemDir = path.join(roundDir, slug);
          const title = humanizeSlug(slug);
          const [problemHtml, analysisHtml, fallback] = await Promise.all([
            readFile(path.join(problemDir, rawProblems.statementFile), "utf-8"),
            readFileSafe(path.join(problemDir, rawProblems.analysisFile)),
            rawProblems.analysisFallbackFile
              ? readFileSafe(
                  path.join(problemDir, rawProblems.analysisFallbackFile),
                )
              : Promise.resolve(null),
          ]);

          return {
            slug,
            title,
            problemHtml,
            analysisHtml:
              analysisHtml ??
              (fallback
                ? `<p>No written analysis — here's the reference solution instead.</p><pre style="white-space: pre-wrap; overflow-wrap: break-word;"><code>${escapeHtml(fallback)}</code></pre>`
                : ""),
            starterCode: {
              cpp: buildStarterCode(title, "cpp"),
              python: buildStarterCode(title, "python"),
            } satisfies Record<Language, string>,
            // Distributed Code Jam has no data/ folder at all.
            testData: null,
          };
        }),
      );

      return {
        year,
        slug: roundSlug,
        title: roundTitle(competition, roundSlug),
        problems: sortProblemsByDifficulty(problems),
      };
    }

    const sources = new Map<string, string>();

    const problems: ProblemData[] = await Promise.all(
      problemSlugs.map(async (slug) => {
        const problemDir = path.join(roundDir, slug);
        const [yaml, problemHtml, analysisHtml, testData] = await Promise.all([
          readFile(path.join(problemDir, "problem.yaml"), "utf-8"),
          readFile(
            path.join(problemDir, "problem_statement", "problem.html"),
            "utf-8",
          ),
          readFile(
            path.join(problemDir, "problem_statement", "analysis.html"),
            "utf-8",
          ),
          readProblemTestData(roundDir, slug),
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
          testData,
        };
      }),
    );

    const firstSource = problems[0] && sources.get(problems[0].slug);
    const title = firstSource ? titleFromSource(firstSource) : roundSlug;

    return {
      year,
      slug: roundSlug,
      title,
      problems: sortProblemsByDifficulty(problems),
    };
  },
);

// --- Hash Code ---------------------------------------------------------
// No problem.yaml, no per-problem HTML, no judge: one combined statement
// PDF per round (a sibling file, not inside the round folder) and one flat
// input-dataset file per problem. Modeled separately from getRound/
// resolveRoundDir above rather than folded into their branching, since the
// shape (files, not problem directories; PDF outside the round dir) doesn't
// fit the split-pane statement+editor workspace the other competitions use.

export interface HashcodeDataset {
  filename: string;
  title: string;
}

export interface HashcodeRoundData {
  year: string;
  slug: string;
  title: string;
  datasets: HashcodeDataset[];
}

function isHashcodeRoundSlug(
  value: string,
): value is (typeof HASHCODE_ROUND_SLUGS)[number] {
  return (HASHCODE_ROUND_SLUGS as readonly string[]).includes(value);
}

export const getHashcodeRound = cache(
  async (year: string, roundSlug: string): Promise<HashcodeRoundData | null> => {
    if (!YEAR_PATTERN.test(year) || !isHashcodeRoundSlug(roundSlug)) {
      return null;
    }

    const roundDir = path.join(
      competitionDir("hashcode"),
      hashcodeRoundDirName(year, roundSlug),
    );
    let files: string[];
    try {
      files = await listFiles(roundDir);
    } catch {
      return null;
    }
    if (files.length === 0) return null;

    const datasets = files
      .map((filename) => ({
        filename,
        title: humanizeDatasetFilename(filename),
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename));

    return { year, slug: roundSlug, title: humanizeSlug(roundSlug), datasets };
  },
);

// Validates (year, round, filename) against the real dataset listing before
// resolving a path — used by both the PDF route and the "reveal in file
// explorer" API route, so neither can be pointed at an arbitrary path.
export async function resolveHashcodeDatasetPath(
  year: string,
  roundSlug: string,
  filename: string,
): Promise<string | null> {
  const round = await getHashcodeRound(year, roundSlug);
  if (!round?.datasets.some((d) => d.filename === filename)) return null;
  return path.join(
    competitionDir("hashcode"),
    hashcodeRoundDirName(year, roundSlug),
    filename,
  );
}

export async function resolveHashcodePdfPath(
  year: string,
  roundSlug: string,
): Promise<string | null> {
  const round = await getHashcodeRound(year, roundSlug);
  if (!round) return null;
  return path.join(
    competitionDir("hashcode"),
    `${hashcodeRoundDirName(year, roundSlug)}.pdf`,
  );
}
