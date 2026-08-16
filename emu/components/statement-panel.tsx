"use client";

import { useMemo, useState } from "react";
import { StatementFrame } from "@/components/statement-frame";
import { SubmitPanel } from "@/components/submit-panel";
import { useTheme } from "@/components/theme-provider";
import type { ProblemTestData } from "@/lib/catalog";
import type { CompetitionId } from "@/lib/competitions";
import { prepareStatementHtml } from "@/lib/statement-html";

type Tab = "problem" | "analysis" | "submit";

const TABS: { id: Tab; label: string }[] = [
  { id: "problem", label: "Problem" },
  { id: "analysis", label: "Analysis" },
  { id: "submit", label: "Submit" },
];

export interface StatementProblem {
  slug: string;
  title: string;
  problemHtml: string;
  analysisHtml: string;
  testData: ProblemTestData | null;
}

export function StatementPanel({
  competition,
  year,
  round,
  problems,
  selectedSlug,
  onSelectProblem,
}: {
  competition: CompetitionId;
  year: string;
  round: string;
  problems: StatementProblem[];
  selectedSlug: string;
  onSelectProblem: (slug: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("problem");
  const { isDark: dark } = useTheme();

  const [prevSlug, setPrevSlug] = useState(selectedSlug);
  if (selectedSlug !== prevSlug) {
    setPrevSlug(selectedSlug);
    setTab("problem");
  }

  const selected =
    problems.find((p) => p.slug === selectedSlug) ?? problems[0];

  const html = useMemo(() => {
    const basePath = `/api/statement/${competition}/${year}/${round}/${selected.slug}/`;
    const raw = tab === "analysis" ? selected.analysisHtml : selected.problemHtml;
    return prepareStatementHtml(raw, { basePath, dark });
  }, [competition, year, round, selected, tab, dark]);

  return (
    <div
      className={`flex h-full flex-col bg-panel text-foreground ${dark ? "dark" : ""}`}
    >
      <div className="flex h-11 shrink-0 items-center border-b border-panel-border px-4">
        <select
          value={selected.slug}
          onChange={(event) => onSelectProblem(event.target.value)}
          aria-label="Select problem"
          className="rounded-md bg-transparent px-1 py-1 text-xs font-medium text-panel-muted outline-none hover:text-foreground"
        >
          {problems.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}
            </option>
          ))}
        </select>
      </div>
      <div className="flex shrink-0 pt-6 pb-4">
        {TABS.map(({ id, label }) => (
          <div key={id} className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id}
              className={`cursor-pointer border-b-2 pb-2 text-sm tracking-wide uppercase transition-colors ${
                tab === id
                  ? "border-blue-600 font-bold text-foreground"
                  : "border-transparent font-medium text-panel-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {tab === "submit" ? (
          <SubmitPanel
            competition={competition}
            year={year}
            round={round}
            problem={selected.slug}
            testData={selected.testData}
          />
        ) : (
          <StatementFrame html={html} title={`${selected.title} — ${tabLabel(tab)}`} />
        )}
      </div>
    </div>
  );
}

function tabLabel(tab: Tab): string {
  return TABS.find((t) => t.id === tab)?.label ?? "";
}
