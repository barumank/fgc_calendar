'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// <1090px: sidebar becomes an off-canvas drawer, content gets full width.
// 1090-1274px: sidebar is a fixed icon-only rail, expandable via a toggle.
// >=1275px: sidebar is always fully expanded (previous fixed behavior).
export type SidebarTier = 'compact' | 'collapsed' | 'full';

const RAIL_WIDTH = 72;
const FULL_WIDTH = 240;

interface SidebarLayoutState {
  tier: SidebarTier;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  railExpanded: boolean;
  setRailExpanded: (v: boolean) => void;
  contentMarginPx: number;
}

const SidebarLayoutContext = createContext<SidebarLayoutState | null>(null);

function computeTier(width: number): SidebarTier {
  if (width < 1090) return 'compact';
  if (width < 1275) return 'collapsed';
  return 'full';
}

export function SidebarLayoutProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<SidebarTier>('full');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [railExpanded, setRailExpanded] = useState(false);

  useEffect(() => {
    const update = () => setTier(computeTier(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Leaving the compact tier (e.g. rotating a tablet, resizing a window)
  // shouldn't leave the drawer stuck open with no backdrop to close it.
  useEffect(() => {
    if (tier !== 'compact') setMobileOpen(false);
  }, [tier]);

  const contentMarginPx = tier === 'compact' ? 0 : tier === 'collapsed' ? (railExpanded ? FULL_WIDTH : RAIL_WIDTH) : FULL_WIDTH;

  return (
    <SidebarLayoutContext.Provider value={{ tier, mobileOpen, setMobileOpen, railExpanded, setRailExpanded, contentMarginPx }}>
      {children}
    </SidebarLayoutContext.Provider>
  );
}

export function useSidebarLayout() {
  const ctx = useContext(SidebarLayoutContext);
  if (!ctx) throw new Error('useSidebarLayout must be used within SidebarLayoutProvider');
  return ctx;
}
