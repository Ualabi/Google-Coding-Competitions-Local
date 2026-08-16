// Pure scoring math shared by the round dashboard, competition catalog, and
// competition picker — kept free of localStorage/fs access so it's safe to
// import from anywhere. Callers own how results are looked up (the
// progress-store key scheme differs by scope), so this just takes an
// accessor function per problem.
import type { ProblemSummary } from "@/lib/catalog";
import type { SubtaskResult } from "@/lib/progress-store";

export interface ProblemProgress {
  gradable: boolean;
  solved: boolean;
  earned: number;
  total: number;
}

export interface AggregateProgress {
  gradableProblems: number;
  solvedProblems: number;
  earned: number;
  total: number;
}

export function computeProblemProgress(
  problem: ProblemSummary,
  getResult: (subtaskId: number) => SubtaskResult | undefined,
): ProblemProgress {
  const testData = problem.testData;
  if (!testData) return { gradable: false, solved: false, earned: 0, total: 0 };

  let earned = 0;
  let allCorrect = testData.subtasks.length > 0;
  for (const subtask of testData.subtasks) {
    const result = getResult(subtask.id);
    if (result?.correct) earned += subtask.acceptScore;
    else allCorrect = false;
  }

  return {
    gradable: true,
    solved: allCorrect,
    earned,
    total: testData.totalScore,
  };
}

export const EMPTY_AGGREGATE: AggregateProgress = {
  gradableProblems: 0,
  solvedProblems: 0,
  earned: 0,
  total: 0,
};

export function addProgress(
  aggregate: AggregateProgress,
  progress: ProblemProgress,
): AggregateProgress {
  if (!progress.gradable) return aggregate;
  return {
    gradableProblems: aggregate.gradableProblems + 1,
    solvedProblems: aggregate.solvedProblems + (progress.solved ? 1 : 0),
    earned: aggregate.earned + progress.earned,
    total: aggregate.total + progress.total,
  };
}

export function mergeAggregates(
  aggregates: AggregateProgress[],
): AggregateProgress {
  return aggregates.reduce(
    (sum, a) => ({
      gradableProblems: sum.gradableProblems + a.gradableProblems,
      solvedProblems: sum.solvedProblems + a.solvedProblems,
      earned: sum.earned + a.earned,
      total: sum.total + a.total,
    }),
    EMPTY_AGGREGATE,
  );
}
