'use client';

import React from 'react';
import { useSidebarLayout } from '@/src/components/layout/sidebar-layout-context';

export function MainContent({ children }: { children: React.ReactNode }) {
  const { contentMarginPx } = useSidebarLayout();

  return (
    <div className="flex flex-col min-h-screen transition-[margin-left] duration-200" style={{ marginLeft: contentMarginPx }}>
      {children}
    </div>
  );
}
