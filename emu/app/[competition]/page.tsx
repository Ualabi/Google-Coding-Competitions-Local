import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPETITIONS, getCatalog, isCompetitionId } from "@/lib/catalog";
import { CompetitionCatalogView } from "@/components/competition-catalog";
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

      <CompetitionCatalogView competition={competition} years={years} />
    </div>
  );
}
