import { notFound } from "next/navigation";
import { getRound, isCompetitionId } from "@/lib/catalog";
import { Workspace } from "@/components/workspace";

export default async function RoundPage({
  params,
}: {
  params: Promise<{ competition: string; year: string; round: string }>;
}) {
  const { competition, year, round } = await params;
  if (!isCompetitionId(competition)) notFound();

  const data = await getRound(competition, year, round);

  if (!data) notFound();

  return (
    <Workspace
      competition={competition}
      year={data.year}
      round={data.slug}
      roundTitle={data.title}
      problems={data.problems}
    />
  );
}
