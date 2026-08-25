'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { UserPlus, Shield, Mail, Lock, User as UserIcon } from 'lucide-react';
import { HeaderActions } from '@/src/components/layout/header-actions';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';
import { Role, ROLES, ROLE_LABELS } from '@/lib/roles';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function UserNameCell({ user, onSave }: { user: AdminUser; onSave: (user: AdminUser, name: string) => void }) {
  const [value, setValue] = useState(user.name ?? '');

  React.useEffect(() => {
    setValue(user.name ?? '');
  }, [user.name]);

  return (
    <input
      type="text"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
      onBlur={() => onSave(user, value.trim())}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && e.currentTarget.blur()}
      placeholder="Не указано"
      className="w-full bg-transparent text-sm text-foreground outline-none border-b border-transparent hover:border-border/50 focus:border-[#EF4444]/50 transition-colors"
    />
  );
}

export function UsersView() {
  const { data: session } = useSession();
  const { data: users, mutate, isLoading } = useSWR<AdminUser[]>('/next-api/users', fetcher);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'moderator' as Role });
  const [submitting, setSubmitting] = useState(false);

  const closeModal = () => {
    setShowCreateModal(false);
    setForm({ email: '', password: '', name: '', role: 'moderator' });
  };

  const handleCreate = async () => {
    if (!form.email.trim() || !form.password || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/next-api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось создать пользователя', 'error');
        return;
      }
      mutate((current) => [...(current ?? []), data], { revalidate: false });
      closeModal();
      showToast('Пользователь создан', 'success');
    } catch {
      showToast('Не удалось создать пользователя', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (user: AdminUser, role: Role) => {
    if (role === user.role) return;
    try {
      const res = await fetch(`/next-api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось изменить роль', 'error');
        return;
      }
      mutate((current) => (current ?? []).map((u) => (u.id === data.id ? data : u)), { revalidate: false });
      showToast('Роль обновлена', 'success');
    } catch {
      showToast('Не удалось изменить роль', 'error');
    }
  };

  const handleNameChange = async (user: AdminUser, name: string) => {
    if (name === (user.name ?? '')) return;
    try {
      const res = await fetch(`/next-api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Не удалось сохранить имя', 'error');
        return;
      }
      mutate((current) => (current ?? []).map((u) => (u.id === data.id ? data : u)), { revalidate: false });
      showToast('Имя сохранено', 'success');
    } catch {
      showToast('Не удалось сохранить имя', 'error');
    }
  };

  return (
    <div className="px-6 pt-6">
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-xl font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-[#EF4444]" />Пользователи</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Создать пользователя
          </button>
          <HeaderActions />
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-4">Загрузка...</div>
      ) : (
        <div className="bg-[#1A1A2E] rounded-xl border border-border/30 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-left text-muted-foreground text-xs">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Роль</th>
                <th className="px-4 py-3 font-medium">Создан</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => (
                <tr key={u.id} className="border-b border-border/10 last:border-0">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3"><UserNameCell user={u} onSave={handleNameChange} /></td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleRoleChange(u, e.target.value as Role)}
                      className="bg-white/5 border border-border/50 rounded-lg px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="bg-[#1A1A2E] text-foreground">{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                    {u.id === session?.user?.id && <span className="ml-2 text-xs text-muted-foreground">(вы)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={closeModal} title="Создать пользователя">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Email</label>
            <div className="flex items-center bg-white/5 rounded-lg border border-border/50 px-3 py-2 gap-2">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="email"
                className="bg-transparent text-sm outline-none flex-1"
                value={form.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="user@example.com"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Пароль</label>
            <div className="flex items-center bg-white/5 rounded-lg border border-border/50 px-3 py-2 gap-2">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="password"
                className="bg-transparent text-sm outline-none flex-1"
                value={form.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Не короче 8 символов"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Имя (необязательно)</label>
            <div className="flex items-center bg-white/5 rounded-lg border border-border/50 px-3 py-2 gap-2">
              <UserIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                className="bg-transparent text-sm outline-none flex-1"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Отображаемое имя"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Роль</label>
            <select
              value={form.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((p) => ({ ...p, role: e.target.value as Role }))}
              className="w-full bg-white/5 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#EF4444]/50"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-[#1A1A2E] text-foreground">{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={!form.email.trim() || !form.password || submitting}
            className="w-full bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
