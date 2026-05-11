import { redirect } from 'next/navigation';

export default function LegacyServersRedirectPage() {
  redirect('/admin/game-servers');
}
