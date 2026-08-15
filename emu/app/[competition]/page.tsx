import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPETITIONS, getCatalog, isCompetitionId } from "@/lib/catalog";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export default async function CompetitionCatalog({
  params,
}: {
  params: Promise<{ competition: string }>;
}) {
  const { competition } = await params;
  if (!isCompetitionId(competition)) notFound();

  const label = COMPETITIONS[competition].label;
  const years = await getCatalog(competition);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-12">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-xs font-medium text-panel-muted hover:text-foreground"
          >
            ← All competitions
          </Link>
          <h1 className="font-departure mt-2 text-2xl tracking-tight">
            {label}
          </h1>
          <p className="mt-2 text-sm text-panel-muted">
            A local, offline archive of {label} — pick a year and a round to
            start solving.
          </p>
        </div>
        <ThemeToggleButton />
      </header>

      <div className="flex flex-col gap-10">
        {years.map(({ year, rounds }) => {
          const mainRounds = rounds.filter((round) => !round.isPractice);
          const practiceRounds = rounds.filter((round) => round.isPractice);

          return (
            <section key={year}>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                {year}
              </h2>
              <div className="flex flex-wrap gap-2">
                {mainRounds.map((round) => (
                  <Link
                    key={round.slug}
                    href={`/${competition}/${year}/${round.slug}`}
                    className="group rounded-lg border border-panel-border bg-panel px-4 py-2.5 transition-colors hover:border-blue-600 hover:bg-blue-600/5"
                  >
                    <div className="text-sm font-medium text-foreground group-hover:text-blue-600">
                      {round.title}
                    </div>
                    <div className="text-xs text-panel-muted">
                      {round.problems.length} problem
                      {round.problems.length === 1 ? "" : "s"}
                    </div>
                  </Link>
                ))}
              </div>

              {practiceRounds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {practiceRounds.map((round) => (
                    <Link
                      key={round.slug}
                      href={`/${competition}/${year}/${round.slug}`}
                      className="group w-[154.2px] rounded-lg border border-panel-border bg-panel-border/40 px-4 py-2.5 transition-colors hover:border-blue-600 hover:bg-blue-600/5"
                    >
                      <div
                        className="truncate text-sm font-medium text-foreground group-hover:text-blue-600"
                        title={round.title}
                      >
                        {round.title}
                      </div>
                      <div className="text-xs text-panel-muted">
                        {round.problems.length} problem
                        {round.problems.length === 1 ? "" : "s"}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
