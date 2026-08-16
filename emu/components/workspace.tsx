"use client";

import Link from "next/link";
import { useState } from "react";
import { CodeEditorPanel } from "@/components/code-editor-panel";
import { StatementPanel } from "@/components/statement-panel";
import { SplitPane } from "@/components/split-pane";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { COMPETITIONS, type CompetitionId } from "@/lib/competitions";
import type { ProblemTestData } from "@/lib/catalog";
import type { Language } from "@/lib/starter-code";

export interface WorkspaceProblem {
  slug: string;
  title: string;
  problemHtml: string;
  analysisHtml: string;
  starterCode: Record<Language, string>;
  testData: ProblemTestData | null;
}

export function Workspace({
  competition,
  year,
  round,
  roundTitle,
  problems,
  initialSlug,
}: {
  competition: CompetitionId;
  year: string;
  round: string;
  roundTitle: string;
  problems: WorkspaceProblem[];
  initialSlug?: string;
}) {
  const [selectedSlug, setSelectedSlug] = useState(
    initialSlug ?? problems[0].slug,
  );
  const selected = problems.find((p) => p.slug === selectedSlug) ?? problems[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex shrink-0 items-center gap-2 border-b border-chrome-border/50 bg-chrome-border/10 px-4 py-2.5">
        <Link
          href="/"
          className="font-departure text-sm tracking-tight hover:opacity-70"
        >
          Archive
        </Link>
        <span className="text-sm text-panel-muted">/</span>
        <Link
          href={`/${competition}`}
          className="text-sm text-panel-muted hover:text-foreground"
        >
          {COMPETITIONS[competition].label}
        </Link>
        <span className="text-sm text-panel-muted">/</span>
        <span className="text-sm text-panel-muted">{year}</span>
        <span className="text-sm text-panel-muted">/</span>
        <Link
          href={`/${competition}/${year}/${round}`}
          className="text-sm text-panel-muted hover:text-foreground"
        >
          {roundTitle}
        </Link>
        <span className="text-sm text-panel-muted">/</span>
        <span className="text-sm font-medium">{selected.title}</span>
        <span className="ml-auto">
          <ThemeToggleButton />
        </span>
      </header>
      <SplitPane
        left={
          <StatementPanel
            competition={competition}
            year={year}
            round={round}
            problems={problems}
            selectedSlug={selectedSlug}
            onSelectProblem={setSelectedSlug}
          />
        }
        right={
          <CodeEditorPanel
            problemId={selected.slug}
            starterCode={selected.starterCode}
          />
        }
      />
    </div>
  );
}
