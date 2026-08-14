'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  CalendarDays, Trophy, Users, BarChart3, UploadCloud, Newspaper,
  LayoutDashboard, Shield, UserCog, Settings, FileText, Bot, ClipboardList,
  ChevronDown, ChevronRight, LogIn, LogOut, Gamepad2, ListTodo, Bell
} from 'lucide-react';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';
import { Role, ROLE_LABELS } from '@/lib/roles';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// null = every subsection is visible for this role
const ADMIN_HREFS_BY_ROLE: Record<Role, string[] | null> = {
  admin: null,
  moderator: ['/admin/requests', '/admin/notifications'],
  user: ['/admin/notifications'],
};

const mainLinks = [
  { href: '/calendar', label: 'Календарь', icon: CalendarDays },
  { href: '/tournaments', label: 'Турниры', icon: Trophy },
  { href: '/players', label: 'Игроки', icon: Users },
  { href: '/rankings', label: 'Рейтинг', icon: BarChart3 },
  { href: '/news', label: 'Новости', icon: Newspaper },
  { href: '/calendar-export', label: 'Экспорт календаря', icon: UploadCloud },
];

const adminSubLinks = [
  { href: '/admin/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/admin/requests', label: 'Заявки', icon: ClipboardList },
  { href: '/admin/disciplines', label: 'Дисциплины', icon: Gamepad2 },
  { href: '/admin/users', label: 'Пользователи', icon: UserCog },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
  { href: '/admin/notifications', label: 'Уведомления', icon: Bell },
  { href: '/admin/system-logs', label: 'Системные логи', icon: FileText },
  { href: '/admin/ai-agents', label: 'AI Агенты', icon: Bot },
  { href: '/admin/backlog', label: 'Бэклог', icon: ListTodo },
];

export function Sidebar() {
  const pathname = usePathname() ?? '';
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const role = ((session?.user as any)?.role ?? 'user') as Role;
  const allowedAdminHrefs = ADMIN_HREFS_BY_ROLE[role];
  const visibleAdminSubLinks = allowedAdminHrefs === null ? adminSubLinks : adminSubLinks.filter((l) => allowedAdminHrefs.includes(l.href));
  const [adminOpen, setAdminOpen] = useState(pathname?.startsWith('/admin'));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { data: authBotSettings } = useSWR<{ botName: string }>('/next-api/admin/settings/telegram-auth', fetcher);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginForm({ email: '', password: '' });
    setLoginError('');
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password || submitting) return;
    setSubmitting(true);
    setLoginError('');
    try {
      const result = await signIn('credentials', {
        email: loginForm.email,
        password: loginForm.password,
        redirect: false,
      });
      if (result?.error) {
        setLoginError('Неверный email или пароль');
      } else {
        closeLoginModal();
        showToast('Вы вошли в систему', 'success');
      }
    } catch {
      setLoginError('Не удалось войти, попробуйте ещё раз');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/calendar' });
  };

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
          const isActive = pathname === link?.href || (link?.href !== '/' && pathname?.startsWith(`${link?.href}/`));
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

        {isAuthenticated && (
          <>
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
              <span className="flex-1 text-left">Личный Кабинет</span>
              {adminOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {adminOpen && (
              <div className="ml-3 space-y-0.5">
                {visibleAdminSubLinks?.map((link: any) => {
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
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-border/30">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {(session?.user?.name ?? session?.user?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{session?.user?.name ?? session?.user?.email}</div>
              <div className="text-xs text-[#EF4444]">{ROLE_LABELS[role]}</div>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors shrink-0" title="Выйти">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-foreground transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Войти
          </button>
        )}
      </div>

      {/* Login modal */}
      <Modal isOpen={showLoginModal} onClose={closeLoginModal} title="Вход">
        <div className="space-y-4">
          <div className="bg-[#229ED9]/10 border border-[#229ED9]/30 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
            На сайте реализована регистрация через Telegram — напишите нашему боту
            {authBotSettings?.botName ? <> (<span className="text-[#229ED9] font-medium">@{authBotSettings.botName.replace(/^@/, '')}</span>)</> : ''}
            , и он в ответ пришлёт вам логин и пароль. Если пароль забыт — напишите тому же боту ещё раз, он вышлет новый.
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Логин</label>
            <input
              type="text"
              className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
              value={loginForm.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm(prev => ({ ...prev, email: e?.target?.value ?? '' }))}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLogin()}
              placeholder="Логин из Telegram или email"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Пароль</label>
            <input
              type="password"
              className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
              value={loginForm.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm(prev => ({ ...prev, password: e?.target?.value ?? '' }))}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
            />
          </div>
          {loginError && <p className="text-sm text-red-400">{loginError}</p>}
          <button
            onClick={handleLogin}
            disabled={!loginForm.email || !loginForm.password || submitting}
            className="w-full bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </Modal>
    </aside>
  );
}
