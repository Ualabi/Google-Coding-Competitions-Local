import Link from "next/link";
import { getCatalog } from "@/lib/catalog";

export default async function Home() {
  const years = await getCatalog();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-12">
      <header className="mb-10">
        <h1 className="font-departure text-2xl tracking-tight">KickStart</h1>
        <p className="mt-2 text-sm text-panel-muted">
          A local, offline archive of every Google Kick Start round — pick a
          year and a round to start solving.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {years.map(({ year, rounds }) => (
          <section key={year}>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">
              {year}
            </h2>
            <div className="flex flex-wrap gap-2">
              {rounds.map((round) => (
                <Link
                  key={round.slug}
                  href={`/${year}/${round.slug}`}
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
          </section>
        ))}
      </div>
    </div>
  );
}
