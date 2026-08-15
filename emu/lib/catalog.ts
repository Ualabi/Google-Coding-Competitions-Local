import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { buildStarterCode, type Language } from "@/lib/starter-code";

// Kept outside the Next.js project root on purpose: this directory is ~3GB
// of archived contest data, and Turbopack's dev-mode file watcher chokes for
// a minute+ on first compile if a directory that size sits inside the
// watched project tree. Point PROBLEMS_LIB_DIR at wherever it actually lives.
export const PROBLEMS_LIB_DIR =
  process.env.PROBLEMS_LIB_DIR ??
  path.join(process.cwd(), "..", "problems_lib");

const SLUG_PATTERN = /^[a-z0-9_-]+$/i;
const YEAR_PATTERN = /^\d{4}$/;

export interface ProblemSummary {
  slug: string;
  title: string;
}

export interface RoundSummary {
  slug: string;
  title: string;
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
  return parts[parts.length - 1]?.trim() || source;
}

function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value) && !value.includes("..");
}

async function listDirs(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function sortRoundSlugs(slugs: string[]): string[] {
  const lettered = slugs.filter((s) => /^round_[a-z]$/.test(s)).sort();
  const rest = slugs.filter((s) => !/^round_[a-z]$/.test(s)).sort();
  return [...lettered, ...rest];
}

async function readProblemSummary(
  yearDir: string,
  roundSlug: string,
  problemSlug: string,
): Promise<ProblemSummary> {
  const yamlPath = path.join(
    PROBLEMS_LIB_DIR,
    yearDir,
    roundSlug,
    problemSlug,
    "problem.yaml",
  );
  const yaml = await readFile(yamlPath, "utf-8");
  return {
    slug: problemSlug,
    title: parseYamlField(yaml, "name") || problemSlug,
  };
}

async function readRoundSummary(
  year: string,
  roundSlug: string,
): Promise<RoundSummary> {
  const roundDir = path.join(PROBLEMS_LIB_DIR, year, roundSlug);
  const problemSlugs = (await listDirs(roundDir)).filter(isValidSlug);

  const problems = await Promise.all(
    problemSlugs.map((slug) => readProblemSummary(year, roundSlug, slug)),
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

  return { slug: roundSlug, title, problems };
}

export const getCatalog = cache(async (): Promise<YearEntry[]> => {
  const yearDirs = (await listDirs(PROBLEMS_LIB_DIR))
    .filter((y) => YEAR_PATTERN.test(y))
    .sort()
    .reverse();

  const years = await Promise.all(
    yearDirs.map(async (year) => {
      const roundSlugs = sortRoundSlugs(
        (await listDirs(path.join(PROBLEMS_LIB_DIR, year))).filter(
          isValidSlug,
        ),
      );
      const rounds = await Promise.all(
        roundSlugs.map((slug) => readRoundSummary(year, slug)),
      );
      return { year, rounds };
    }),
  );

  return years;
});

export const getRound = cache(
  async (year: string, roundSlug: string): Promise<RoundData | null> => {
    if (!YEAR_PATTERN.test(year) || !isValidSlug(roundSlug)) return null;

    const roundDir = path.join(PROBLEMS_LIB_DIR, year, roundSlug);
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
