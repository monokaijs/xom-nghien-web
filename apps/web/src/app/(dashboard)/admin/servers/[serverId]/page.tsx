import { redirect } from 'next/navigation';

export default function LegacyServerRedirectPage() {
  redirect('/admin/cs2-servers');
}
