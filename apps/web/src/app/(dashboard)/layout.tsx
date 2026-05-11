import DashboardLayout from "@/components/layout/DashboardLayout";

export default function SharedDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}