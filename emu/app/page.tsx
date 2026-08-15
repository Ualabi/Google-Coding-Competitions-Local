import Link from "next/link";
import { COMPETITIONS, getCatalog, type CompetitionId } from "@/lib/catalog";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export default async function Home() {
  const competitionIds = Object.keys(COMPETITIONS) as CompetitionId[];
  const catalogs = await Promise.all(
    competitionIds.map((id) => getCatalog(id)),
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-12">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-departure text-2xl tracking-tight">
            Coding Competitions
          </h1>
          <p className="mt-2 text-sm text-panel-muted">
            A local, offline archive of Google&apos;s coding competitions —
            pick one to start solving.
          </p>
        </div>
        <ThemeToggleButton />
      </header>

      <div className="flex flex-wrap gap-3">
        {competitionIds.map((id, i) => {
          const years = catalogs[i];
          const roundCount = years.reduce((n, y) => n + y.rounds.length, 0);

          return (
            <Link
              key={id}
              href={`/${id}`}
              className="group w-56 rounded-lg border border-panel-border bg-panel px-4 py-3 transition-colors hover:border-blue-600 hover:bg-blue-600/5"
            >
              <div className="text-sm font-medium text-foreground group-hover:text-blue-600">
                {COMPETITIONS[id].label}
              </div>
              <div className="text-xs text-panel-muted">
                {years.length} year{years.length === 1 ? "" : "s"} ·{" "}
                {roundCount} round{roundCount === 1 ? "" : "s"}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
