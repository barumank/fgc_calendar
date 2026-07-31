'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays, Trophy, Users, BarChart3, UploadCloud, Newspaper,
  LayoutDashboard, Shield, UserCog, Settings, FileText, Bot,
  ChevronDown, ChevronRight
} from 'lucide-react';

const mainLinks = [
  { href: '/calendar', label: 'Календарь', icon: CalendarDays },
  { href: '/tournaments', label: 'Турниры', icon: Trophy },
  { href: '/players', label: 'Игроки', icon: Users },
  { href: '/rankings', label: 'Рейтинг', icon: BarChart3 },
  { href: '/calendar-export', label: 'Экспорт календаря', icon: UploadCloud },
  { href: '/news', label: 'Новости', icon: Newspaper },
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
];

const adminSubLinks = [
  { href: '/admin/users', label: 'Пользователи', icon: UserCog },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
  { href: '/admin/system-logs', label: 'Системные логи', icon: FileText },
  { href: '/admin/ai-agents', label: 'AI Агенты', icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname() ?? '';
  const [adminOpen, setAdminOpen] = useState(pathname?.startsWith('/admin'));

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-[#111128] border-r border-border/50 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border/30">
        <Link href="/calendar" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#EF4444] rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-white tracking-wide">FIGHT<span className="text-[#EF4444]">NEXUS</span></div>
            <div className="text-[10px] text-muted-foreground tracking-[0.2em]">TOURNAMENTS</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {mainLinks?.map((link: any) => {
          const Icon = link?.icon;
          const isActive = pathname === link?.href || (link?.href !== '/' && pathname?.startsWith(link?.href));
          return (
            <Link
              key={link?.href}
              href={link?.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#EF4444]/10 text-[#EF4444] font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {Icon && <Icon className="w-[18px] h-[18px] shrink-0" />}
              <span>{link?.label}</span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="!my-3 border-t border-border/30" />

        {/* Admin Panel */}
        <button
          onClick={() => setAdminOpen((p: boolean) => !p)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors ${
            pathname?.startsWith('/admin')
              ? 'text-[#EF4444] font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Shield className="w-[18px] h-[18px] shrink-0" />
          <span className="flex-1 text-left">Админ Панель</span>
          {adminOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {adminOpen && (
          <div className="ml-3 space-y-0.5">
            {adminSubLinks?.map((link: any) => {
              const Icon = link?.icon;
              const isActive = pathname === link?.href;
              return (
                <Link
                  key={link?.href}
                  href={link?.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-[#EF4444]/10 text-[#EF4444] font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0" />}
                  <span>{link?.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">Aether_Ryu</div>
            <div className="text-xs text-[#EF4444]">Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
