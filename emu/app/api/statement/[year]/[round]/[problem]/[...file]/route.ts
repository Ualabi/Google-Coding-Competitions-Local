import { readFile } from "node:fs/promises";
import path from "node:path";
import { PROBLEMS_LIB_DIR } from "@/lib/catalog";

const SLUG_PATTERN = /^[a-z0-9_.-]+$/i;

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function isValidSegment(value: string): boolean {
  return SLUG_PATTERN.test(value) && !value.includes("..");
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      year: string;
      round: string;
      problem: string;
      file: string[];
    }>;
  },
) {
  const { year, round, problem, file } = await params;

  if (
    !/^\d{4}$/.test(year) ||
    !isValidSegment(round) ||
    !isValidSegment(problem) ||
    file.length === 0 ||
    !file.every(isValidSegment)
  ) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(file[file.length - 1]).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(
    PROBLEMS_LIB_DIR,
    year,
    round,
    problem,
    "problem_statement",
    ...file,
  );

  try {
    const data = await readFile(filePath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
