import { redirect } from 'next/navigation';

export default async function LegacyMatchPage({
  params,
}: {
  params: Promise<{ matchid: string }>;
}) {
  const { matchid } = await params;
  redirect(`/cs2/matches/${encodeURIComponent(matchid)}`);
}
