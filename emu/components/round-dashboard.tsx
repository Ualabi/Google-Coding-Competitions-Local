"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import type { RoundData } from "@/lib/catalog";
import { COMPETITIONS, type CompetitionId } from "@/lib/competitions";
import { loadRoundResults, type SubtaskResult } from "@/lib/progress-store";

export function RoundDashboard({
  competition,
  data,
}: {
  competition: CompetitionId;
  data: RoundData;
}) {
  const [results, setResults] = useState<Map<string, SubtaskResult>>(
    new Map(),
  );

  useEffect(() => {
    // One-time sync from localStorage (external truth) into React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResults(loadRoundResults(competition, data.year, data.slug));
  }, [competition, data.year, data.slug]);

  function earned(problemSlug: string, subtaskId: number): number {
    const result = results.get(`${problemSlug}/${subtaskId}`);
    return result?.correct ? result.acceptScore : 0;
  }

  const gradableProblems = data.problems.filter((p) => p.testData);
  const roundMax = gradableProblems.reduce(
    (sum, p) => sum + (p.testData?.totalScore ?? 0),
    0,
  );
  const roundEarned = gradableProblems.reduce((sum, p) => {
    const problemEarned = (p.testData?.subtasks ?? []).reduce(
      (s, st) => s + earned(p.slug, st.id),
      0,
    );
    return sum + problemEarned;
  }, 0);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-12">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-panel-muted">
            <Link href="/" className="hover:text-foreground">
              Archive
            </Link>
            <span>/</span>
            <Link href={`/${competition}`} className="hover:text-foreground">
              {COMPETITIONS[competition].label}
            </Link>
            <span>/</span>
            <span>{data.year}</span>
          </div>
          <h1 className="font-departure mt-2 text-2xl tracking-tight">
            {data.title}
          </h1>
        </div>
        <ThemeToggleButton />
      </header>

      {gradableProblems.length > 0 && (
        <div className="mb-8 flex items-center justify-between rounded-lg border border-panel-border bg-panel px-5 py-4">
          <div className="text-sm text-panel-muted">Your score</div>
          <div className="text-2xl font-semibold tabular-nums">
            {roundEarned}
            <span className="text-base font-normal text-panel-muted">
              {" "}
              / {roundMax}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.problems.map((problem) => {
          const testData = problem.testData;
          const problemEarned = testData
            ? testData.subtasks.reduce(
                (s, st) => s + earned(problem.slug, st.id),
                0,
              )
            : 0;
          const solvedCount = testData
            ? testData.subtasks.filter(
                (st) => results.get(`${problem.slug}/${st.id}`)?.correct,
              ).length
            : 0;

          return (
            <Link
              key={problem.slug}
              href={`/${competition}/${data.year}/${data.slug}/${problem.slug}`}
              className="group rounded-lg border border-panel-border bg-panel p-4 transition-colors hover:border-blue-600 hover:bg-blue-600/5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium group-hover:text-blue-600">
                  {problem.title}
                </div>
                {testData && (
                  <div className="text-xs text-panel-muted tabular-nums">
                    {problemEarned} / {testData.totalScore}
                  </div>
                )}
              </div>

              {testData ? (
                <>
                  <div className="mt-3 flex gap-1">
                    {testData.subtasks.map((st) => (
                      <div
                        key={st.id}
                        title={`Subtask ${st.id}: ${st.acceptScore} pt${st.acceptScore === 1 ? "" : "s"}`}
                        className={`h-1.5 flex-1 rounded-full ${
                          results.get(`${problem.slug}/${st.id}`)?.correct
                            ? "bg-green-600"
                            : "bg-panel-border"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 text-xs text-panel-muted">
                    {solvedCount} / {testData.subtasks.length} subtasks solved
                  </div>
                </>
              ) : (
                <div className="mt-3 text-xs text-panel-muted">
                  No judge data for this problem
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
