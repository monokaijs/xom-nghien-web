import React from 'react';

interface DashboardColumnsProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  stackSidebarOnTablet?: boolean;
}

export default function DashboardColumns({
  children,
  sidebar,
  stackSidebarOnTablet = false,
}: DashboardColumnsProps) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(270px,0.82fr)] gap-[30px] max-xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.85fr)] max-lg:grid-cols-1">
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
      <aside className={`flex min-w-0 flex-col gap-[30px] max-lg:grid max-lg:items-start ${
        stackSidebarOnTablet ? 'max-lg:grid-cols-1' : 'max-lg:grid-cols-2 max-md:grid-cols-1'
      }`}>
        {sidebar}
      </aside>
    </div>
  );
}
