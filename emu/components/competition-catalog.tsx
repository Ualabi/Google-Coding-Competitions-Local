"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { RoundSummary, YearEntry } from "@/lib/catalog";
import type { CompetitionId } from "@/lib/competitions";
import { loadCompetitionResults, type SubtaskResult } from "@/lib/progress-store";
import {
  addProgress,
  computeProblemProgress,
  EMPTY_AGGREGATE,
  mergeAggregates,
  type AggregateProgress,
} from "@/lib/scoring";

export function CompetitionCatalogView({
  competition,
  years,
}: {
  competition: CompetitionId;
  years: YearEntry[];
}) {
  const [results, setResults] = useState<Map<string, SubtaskResult>>(
    new Map(),
  );

  useEffect(() => {
    // One-time sync from localStorage (external truth) into React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResults(loadCompetitionResults(competition));
  }, [competition]);

  function roundProgress(year: string, round: RoundSummary): AggregateProgress {
    return round.problems.reduce((aggregate, problem) => {
      const getResult = (subtaskId: number) =>
        results.get(`${year}/${round.slug}/${problem.slug}/${subtaskId}`);
      return addProgress(aggregate, computeProblemProgress(problem, getResult));
    }, EMPTY_AGGREGATE);
  }

  return (
    <div className="flex flex-col gap-10">
      {years.map(({ year, rounds }) => {
        const mainRounds = rounds.filter((round) => !round.isPractice);
        const practiceRounds = rounds.filter((round) => round.isPractice);
        const progressByRound = new Map(
          rounds.map((round) => [round.slug, roundProgress(year, round)]),
        );
        const yearProgress = mergeAggregates([...progressByRound.values()]);

        const yearSolvedPercent =
          yearProgress.gradableProblems > 0
            ? (yearProgress.solvedProblems / yearProgress.gradableProblems) * 100
            : 0;

        return (
          <section key={year}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="shrink-0 text-lg font-semibold tracking-tight">
                {year}
              </h2>
              {yearProgress.gradableProblems > 0 && (
                <>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-border">
                    <div
                      className="h-full rounded-full bg-green-600"
                      style={{ width: `${yearSolvedPercent}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs text-panel-muted tabular-nums">
                    {yearProgress.solvedProblems} solved of{" "}
                    {yearProgress.gradableProblems}
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {mainRounds.map((round) => (
                <RoundPill
                  key={round.slug}
                  href={`/${competition}/${year}/${round.slug}`}
                  round={round}
                  progress={progressByRound.get(round.slug)!}
                  widthClass="w-[calc((100%-3.5rem)/8)]"
                  variant="main"
                />
              ))}
            </div>

            {practiceRounds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {practiceRounds.map((round) => (
                  <RoundPill
                    key={round.slug}
                    href={`/${competition}/${year}/${round.slug}`}
                    round={round}
                    progress={progressByRound.get(round.slug)!}
                    widthClass="w-[calc((100%-2rem)/5)]"
                    variant="practice"
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function RoundPill({
  href,
  round,
  progress,
  widthClass,
  variant,
}: {
  href: string;
  round: RoundSummary;
  progress: AggregateProgress;
  widthClass: string;
  variant: "main" | "practice";
}) {
  const solved =
    progress.gradableProblems > 0 &&
    progress.solvedProblems === progress.gradableProblems;

  const baseBg = variant === "main" ? "bg-panel" : "bg-panel-border/40";
  const boxClasses = solved
    ? "border-green-600/60 bg-green-600/10 hover:border-green-600 hover:bg-green-600/15"
    : `border-panel-border ${baseBg} hover:border-blue-600 hover:bg-blue-600/5`;
  const titleClasses = solved
    ? "text-green-700 dark:text-green-500"
    : "text-foreground group-hover:text-blue-600";

  return (
    <Link
      href={href}
      className={`group ${widthClass} min-w-[6rem] rounded-lg border ${boxClasses} px-4 py-2.5 transition-colors`}
    >
      <div className={`truncate text-sm font-medium ${titleClasses}`} title={round.title}>
        {round.title}
      </div>
      {progress.gradableProblems > 0 ? (
        <>
          <div className="text-xs text-panel-muted tabular-nums">
            {progress.solvedProblems} / {progress.gradableProblems} solved
          </div>
          <div className="text-xs text-panel-muted tabular-nums">
            {progress.earned} / {progress.total} pts
          </div>
        </>
      ) : (
        <div className="text-xs text-panel-muted">
          {round.problems.length} problem{round.problems.length === 1 ? "" : "s"}
        </div>
      )}
    </Link>
  );
}
