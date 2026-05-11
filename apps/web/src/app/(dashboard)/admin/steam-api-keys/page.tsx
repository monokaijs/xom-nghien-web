import { redirect } from 'next/navigation';

export default function LegacySteamKeysRedirectPage() {
  redirect('/admin/game-credentials');
}
