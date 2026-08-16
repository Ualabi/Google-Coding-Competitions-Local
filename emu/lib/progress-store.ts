// Client-only: tracks judge results per subtask in localStorage. This is a
// single-user local tool with no backend, so "your score for this round"
// just lives in the browser — nothing to sync, nothing to lose privacy
// over.
"use client";

export interface SubtaskResult {
  correct: boolean;
  acceptScore: number;
  submittedAt: number;
}

const PREFIX = "gcc:progress:";

function storageKey(
  competition: string,
  year: string,
  round: string,
  problem: string,
  subtaskId: number,
): string {
  return `${PREFIX}${competition}/${year}/${round}/${problem}/${subtaskId}`;
}

export function loadSubtaskResult(
  competition: string,
  year: string,
  round: string,
  problem: string,
  subtaskId: number,
): SubtaskResult | null {
  try {
    const raw = localStorage.getItem(
      storageKey(competition, year, round, problem, subtaskId),
    );
    return raw ? (JSON.parse(raw) as SubtaskResult) : null;
  } catch {
    return null;
  }
}

export function saveSubtaskResult(
  competition: string,
  year: string,
  round: string,
  problem: string,
  subtaskId: number,
  result: Omit<SubtaskResult, "submittedAt">,
): void {
  try {
    localStorage.setItem(
      storageKey(competition, year, round, problem, subtaskId),
      JSON.stringify({ ...result, submittedAt: Date.now() }),
    );
  } catch {
    // localStorage unavailable (private browsing quota, etc.) — the
    // submission still worked, it just won't persist across reloads.
  }
}

function loadResultsWithPrefix(prefix: string): Map<string, SubtaskResult> {
  const results = new Map<string, SubtaskResult>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        results.set(key.slice(prefix.length), JSON.parse(raw) as SubtaskResult);
      } catch {
        // skip malformed entries
      }
    }
  } catch {
    // localStorage unavailable — return whatever we found (nothing).
  }
  return results;
}

// Every stored subtask result for a given round, keyed by "<problem>/<subtaskId>".
export function loadRoundResults(
  competition: string,
  year: string,
  round: string,
): Map<string, SubtaskResult> {
  return loadResultsWithPrefix(`${PREFIX}${competition}/${year}/${round}/`);
}

// Every stored subtask result for a whole competition, keyed by
// "<year>/<round>/<problem>/<subtaskId>".
export function loadCompetitionResults(
  competition: string,
): Map<string, SubtaskResult> {
  return loadResultsWithPrefix(`${PREFIX}${competition}/`);
}

// Every stored subtask result across every competition, keyed by
// "<competition>/<year>/<round>/<problem>/<subtaskId>".
export function loadAllResults(): Map<string, SubtaskResult> {
  return loadResultsWithPrefix(PREFIX);
}
