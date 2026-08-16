import { readFile } from "node:fs/promises";
import {
  isCompetitionId,
  judgeSubtaskOutput,
  resolveSubtaskInputPath,
} from "@/lib/catalog";

type RouteParams = {
  params: Promise<{
    competition: string;
    year: string;
    round: string;
    problem: string;
    subtask: string;
  }>;
};

function parseParams(raw: Awaited<RouteParams["params"]>) {
  const { competition, year, round, problem, subtask } = raw;
  const subtaskId = Number(subtask);
  if (
    !isCompetitionId(competition) ||
    !/^\d{4}$/.test(year) ||
    !/^[a-z0-9_-]+$/i.test(round) ||
    !/^[a-z0-9_-]+$/i.test(problem) ||
    !Number.isInteger(subtaskId) ||
    subtaskId < 1
  ) {
    return null;
  }
  return { competition, year, round, problem, subtaskId };
}

// Downloads the subtask's input file — the thing you'd feed your own
// program, since Hash Code–style "run it yourself" is exactly how these
// competitions' judges actually worked (you never submitted source code).
export async function GET(_request: Request, { params }: RouteParams) {
  const parsed = parseParams(await params);
  if (!parsed) return new Response("Not found", { status: 404 });

  const inputPath = await resolveSubtaskInputPath(
    parsed.competition,
    parsed.year,
    parsed.round,
    parsed.problem,
    parsed.subtaskId,
  );
  if (!inputPath) return new Response("Not found", { status: 404 });

  try {
    const data = await readFile(inputPath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${parsed.problem}_subtask${parsed.subtaskId}.in.txt"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

// Grades a submitted output against the subtask's reference answer.
export async function POST(request: Request, { params }: RouteParams) {
  const parsed = parseParams(await params);
  if (!parsed) return new Response("Not found", { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { output } = (body ?? {}) as Record<string, unknown>;
  if (typeof output !== "string" || output.trim().length === 0) {
    return Response.json({ error: "Missing output." }, { status: 400 });
  }
  // A handful of real subtasks (e.g. Kick Start 2021 Round D "Final Exam")
  // have reference answers upward of 50MB, so this needs real headroom.
  if (output.length > 80_000_000) {
    return Response.json({ error: "Output too large." }, { status: 413 });
  }

  const result = await judgeSubtaskOutput(
    parsed.competition,
    parsed.year,
    parsed.round,
    parsed.problem,
    parsed.subtaskId,
    output,
  );
  if (!result) return new Response("Not found", { status: 404 });

  return Response.json(result);
}
