import { redirect } from 'next/navigation';

export default function LegacyServerRedirectPage() {
  redirect('/admin/game-servers');
}
