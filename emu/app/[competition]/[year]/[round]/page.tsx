import { notFound } from "next/navigation";
import { getRound, isCompetitionId } from "@/lib/catalog";
import { RoundDashboard } from "@/components/round-dashboard";

export default async function RoundDashboardPage({
  params,
}: {
  params: Promise<{ competition: string; year: string; round: string }>;
}) {
  const { competition, year, round } = await params;
  if (!isCompetitionId(competition)) notFound();

  const data = await getRound(competition, year, round);

  if (!data) notFound();

  return <RoundDashboard competition={competition} data={data} />;
}
