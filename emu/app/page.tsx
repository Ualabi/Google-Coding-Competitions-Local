import { COMPETITIONS, getCatalog, type CompetitionId } from "@/lib/catalog";
import { CompetitionPicker } from "@/components/competition-picker";
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

      <CompetitionPicker competitionIds={competitionIds} catalogs={catalogs} />
    </div>
  );
}
