import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Skin Changer - Team Checkmate',
  description: 'Customize your CS2 weapon skins, agents, and more',
};

export default function SkinChangerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
