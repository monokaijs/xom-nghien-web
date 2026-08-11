import ServerManagementPage from '@/components/admin/ServerManagementPage';

export default async function GameServerManagementRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ServerManagementPage serverId={id} />;
}
