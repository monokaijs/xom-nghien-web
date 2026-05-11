import { redirect } from 'next/navigation';

export default function TempServerRedirectPage() {
  redirect('/lobbies');
}
