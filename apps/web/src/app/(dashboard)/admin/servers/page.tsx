import { redirect } from 'next/navigation';

export default function LegacyServersRedirectPage() {
  redirect('/admin/cs2-servers');
}
