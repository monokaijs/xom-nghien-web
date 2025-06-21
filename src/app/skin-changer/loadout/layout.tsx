import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Loadout - Team Checkmate',
  description: 'View and manage your CS2 weapon customizations and loadout',
};

export default function LoadoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
