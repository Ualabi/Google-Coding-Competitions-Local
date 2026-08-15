import { notFound } from "next/navigation";
import { getRound } from "@/lib/catalog";
import { Workspace } from "@/components/workspace";

export default async function RoundPage({
  params,
}: {
  params: Promise<{ year: string; round: string }>;
}) {
  const { year, round } = await params;
  const data = await getRound(year, round);

  if (!data) notFound();

  return (
    <Workspace
      year={data.year}
      round={data.slug}
      roundTitle={data.title}
      problems={data.problems}
    />
  );
}
