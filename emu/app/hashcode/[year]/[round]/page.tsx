import Link from "next/link";
import { notFound } from "next/navigation";
import { getHashcodeRound } from "@/lib/catalog";
import { HashcodeDatasetList } from "@/components/hashcode-dataset-list";
import { SplitPane } from "@/components/split-pane";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export default async function HashcodeRoundPage({
  params,
}: {
  params: Promise<{ year: string; round: string }>;
}) {
  const { year, round } = await params;
  const data = await getHashcodeRound(year, round);

  if (!data) notFound();

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
          href="/hashcode"
          className="text-sm text-panel-muted hover:text-foreground"
        >
          Hash Code
        </Link>
        <span className="text-sm text-panel-muted">/</span>
        <span className="text-sm text-panel-muted">{data.year}</span>
        <span className="text-sm text-panel-muted">/</span>
        <span className="text-sm font-medium">{data.title}</span>
        <span className="ml-auto">
          <ThemeToggleButton />
        </span>
      </header>
      <SplitPane
        initialLeftPercent={68}
        left={
          <iframe
            src={`/api/hashcode/pdf/${data.year}/${data.slug}`}
            title={`${data.title} statement`}
            className="h-full w-full border-0"
          />
        }
        right={
          <HashcodeDatasetList
            year={data.year}
            round={data.slug}
            datasets={data.datasets}
          />
        }
      />
    </div>
  );
}
