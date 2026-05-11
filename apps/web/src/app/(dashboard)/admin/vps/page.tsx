import { redirect } from 'next/navigation';

export default function LegacyVpsRedirectPage() {
  redirect('/admin/server-hosts');
}
