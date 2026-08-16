"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { YearEntry } from "@/lib/catalog";
import { COMPETITIONS, type CompetitionId } from "@/lib/competitions";
import { loadAllResults, type SubtaskResult } from "@/lib/progress-store";
import {
  addProgress,
  computeProblemProgress,
  EMPTY_AGGREGATE,
  type AggregateProgress,
} from "@/lib/scoring";

export function CompetitionPicker({
  competitionIds,
  catalogs,
}: {
  competitionIds: CompetitionId[];
  catalogs: YearEntry[][];
}) {
  const [results, setResults] = useState<Map<string, SubtaskResult>>(
    new Map(),
  );

  useEffect(() => {
    // One-time sync from localStorage (external truth) into React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResults(loadAllResults());
  }, []);

  const stats = competitionIds.map((id, i) => {
    const years = catalogs[i];
    const roundCount = years.reduce((n, y) => n + y.rounds.length, 0);

    let problemCount = 0;
    let progress: AggregateProgress = EMPTY_AGGREGATE;
    for (const { year, rounds } of years) {
      for (const round of rounds) {
        for (const problem of round.problems) {
          problemCount += 1;
          const getResult = (subtaskId: number) =>
            results.get(
              `${id}/${year}/${round.slug}/${problem.slug}/${subtaskId}`,
            );
          progress = addProgress(
            progress,
            computeProblemProgress(problem, getResult),
          );
        }
      }
    }

    return { id, years, roundCount, problemCount, progress };
  });

  // Competitions with no evaluation system at all (nothing gradable) sort
  // last — everything else keeps its original order (stable sort).
  const sorted = [...stats].sort(
    (a, b) => Number(b.progress.gradableProblems > 0) - Number(a.progress.gradableProblems > 0),
  );

  return (
    <div className="flex flex-wrap gap-3">
      {sorted.map(({ id, years, roundCount, problemCount, progress }) => {
        const solvedPercent =
          progress.gradableProblems > 0
            ? (progress.solvedProblems / progress.gradableProblems) * 100
            : 0;

        return (
          <Link
            key={id}
            href={`/${id}`}
            className="group w-[calc((100%-0.75rem)/2)] min-w-[10rem] rounded-lg border border-panel-border bg-panel px-4 py-3 transition-colors hover:border-blue-600 hover:bg-blue-600/5"
          >
            <div
              className="truncate text-sm font-medium text-foreground group-hover:text-blue-600"
              title={COMPETITIONS[id].label}
            >
              {COMPETITIONS[id].label}
            </div>
            <div className="text-xs text-panel-muted">
              {years.length} year{years.length === 1 ? "" : "s"} ·{" "}
              {roundCount} round{roundCount === 1 ? "" : "s"} · {problemCount}{" "}
              problem{problemCount === 1 ? "" : "s"}
            </div>
            {progress.gradableProblems > 0 && (
              <>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-panel-border">
                  <div
                    className="h-full rounded-full bg-green-600"
                    style={{ width: `${solvedPercent}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-panel-muted tabular-nums">
                  {progress.solvedProblems} / {progress.gradableProblems} solved
                </div>
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}
