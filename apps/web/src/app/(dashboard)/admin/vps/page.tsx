import { redirect } from 'next/navigation';

export default function LegacyVpsRedirectPage() {
  redirect('/admin/cs2-servers?tab=hosts');
}
