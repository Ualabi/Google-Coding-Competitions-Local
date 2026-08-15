"use client";

import Link from "next/link";
import { useState } from "react";
import { CodeEditorPanel } from "@/components/code-editor-panel";
import { StatementPanel } from "@/components/statement-panel";
import { SplitPane } from "@/components/split-pane";
import type { Language } from "@/lib/starter-code";

export interface WorkspaceProblem {
  slug: string;
  title: string;
  problemHtml: string;
  analysisHtml: string;
  starterCode: Record<Language, string>;
}

export function Workspace({
  year,
  round,
  roundTitle,
  problems,
}: {
  year: string;
  round: string;
  roundTitle: string;
  problems: WorkspaceProblem[];
}) {
  const [selectedSlug, setSelectedSlug] = useState(problems[0].slug);
  const selected = problems.find((p) => p.slug === selectedSlug) ?? problems[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex shrink-0 items-center gap-2 border-b border-chrome-border/50 bg-chrome-border/10 px-4 py-2.5">
        <Link
          href="/"
          className="font-departure text-sm tracking-tight hover:opacity-70"
        >
          KickStart
        </Link>
        <span className="text-sm text-panel-muted">/</span>
        <span className="text-sm text-panel-muted">{year}</span>
        <span className="text-sm text-panel-muted">/</span>
        <span className="text-sm font-medium">{roundTitle}</span>
      </header>
      <SplitPane
        left={
          <StatementPanel
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
