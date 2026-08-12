export type Role = 'admin' | 'moderator' | 'user';

export const ROLES: Role[] = ['admin', 'moderator', 'user'];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Администратор',
  moderator: 'Модератор',
  user: 'Пользователь',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as string[]).includes(value);
}
