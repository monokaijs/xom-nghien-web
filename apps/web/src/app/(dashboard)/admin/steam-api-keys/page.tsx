import { redirect } from 'next/navigation';

export default function LegacySteamKeysRedirectPage() {
  redirect('/admin/cs2-servers?tab=credentials');
}
