"use client";

import { useEffect, useState } from "react";
import type { ProblemTestData, SubtaskInfo } from "@/lib/catalog";
import type { CompetitionId } from "@/lib/competitions";
import {
  loadSubtaskResult,
  saveSubtaskResult,
  type SubtaskResult,
} from "@/lib/progress-store";

export function SubmitPanel({
  competition,
  year,
  round,
  problem,
  testData,
}: {
  competition: CompetitionId;
  year: string;
  round: string;
  problem: string;
  testData: ProblemTestData | null;
}) {
  if (!testData) {
    return (
      <div className="p-6 text-sm text-panel-muted">
        This problem has no downloadable test data — either it&apos;s judged
        interactively (a live custom judge, not fixed input/output files)
        or this competition doesn&apos;t ship one at all.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      <p className="text-sm text-panel-muted">
        Download each subtask&apos;s input, run your program against it locally,
        then upload or paste the output it produced to check it against the
        expected answer.
      </p>
      {testData.subtasks.map((subtask) => (
        <SubtaskCard
          key={subtask.id}
          competition={competition}
          year={year}
          round={round}
          problem={problem}
          subtask={subtask}
        />
      ))}
    </div>
  );
}

function SubtaskCard({
  competition,
  year,
  round,
  problem,
  subtask,
}: {
  competition: CompetitionId;
  year: string;
  round: string;
  problem: string;
  subtask: SubtaskInfo;
}) {
  const [result, setResult] = useState<SubtaskResult | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // One-time sync from localStorage (external truth) into React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(
      loadSubtaskResult(competition, year, round, problem, subtask.id),
    );
  }, [competition, year, round, problem, subtask.id]);

  const apiPath = `/api/testdata/${competition}/${year}/${round}/${problem}/${subtask.id}`;

  async function submit(output: string) {
    if (output.trim().length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        return;
      }
      const judged = data as { correct: boolean; acceptScore: number };
      saveSubtaskResult(competition, year, round, problem, subtask.id, judged);
      setResult({ ...judged, submittedAt: Date.now() });
    } catch {
      setError("Couldn't reach the app server.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFile(file: File) {
    const content = await file.text();
    setText(content);
    await submit(content);
  }

  return (
    <div className="rounded-lg border border-panel-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">Subtask {subtask.id}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-panel-muted">
            {subtask.acceptScore} pt{subtask.acceptScore === 1 ? "" : "s"}
          </span>
          {result && (
            <span
              className={`text-xs font-medium ${
                result.correct ? "text-green-600" : "text-red-500"
              }`}
            >
              {result.correct ? "✓ Accepted" : "✗ Wrong answer"}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <a
          href={apiPath}
          download
          className="rounded-md border border-panel-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-blue-600 hover:text-blue-600"
        >
          Download input
        </a>
        <label className="cursor-pointer rounded-md border border-panel-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-blue-600 hover:text-blue-600">
          Upload output
          <input
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleFile(file);
            }}
          />
        </label>
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="...or paste your program's output here"
        rows={3}
        className="mt-2 w-full resize-y rounded-md border border-panel-border bg-transparent p-2 font-mono text-xs text-foreground outline-none placeholder:text-panel-muted"
      />

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={submitting || text.trim().length === 0}
          onClick={() => submit(text)}
          className="rounded-md border border-panel-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Checking…" : "Submit"}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
