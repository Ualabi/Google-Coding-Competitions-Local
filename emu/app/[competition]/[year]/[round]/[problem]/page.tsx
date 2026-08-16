import { notFound } from "next/navigation";
import { getRound, isCompetitionId } from "@/lib/catalog";
import { Workspace } from "@/components/workspace";

export default async function ProblemWorkspacePage({
  params,
}: {
  params: Promise<{
    competition: string;
    year: string;
    round: string;
    problem: string;
  }>;
}) {
  const { competition, year, round, problem } = await params;
  if (!isCompetitionId(competition)) notFound();

  const data = await getRound(competition, year, round);
  if (!data) notFound();
  if (!data.problems.some((p) => p.slug === problem)) notFound();

  return (
    <Workspace
      competition={competition}
      year={data.year}
      round={data.slug}
      roundTitle={data.title}
      problems={data.problems}
      initialSlug={problem}
    />
  );
}
