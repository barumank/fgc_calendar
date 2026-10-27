import Link from 'next/link';
import { KeyRound, ServerCrash, ShieldAlert } from 'lucide-react';
import { ErrorScreen, primaryButtonClass } from '@/src/components/common/error-screen';

export const metadata = {
  title: 'Ошибка входа',
  robots: { index: false },
};

// NextAuth sends the user here with ?error=<code> when sign-in fails outside
// the login modal (which handles wrong credentials itself).
const MESSAGES: Record<string, { title: string; description: string; kind: 'server' | 'access' | 'login' }> = {
  Configuration: {
    kind: 'server',
    title: 'Сервис входа временно недоступен',
    description: 'Что-то пошло не так на нашей стороне. Попробуйте войти ещё раз через несколько минут.',
  },
  AccessDenied: {
    kind: 'access',
    title: 'Доступ запрещён',
    description: 'У вашей учётной записи нет прав для входа или открытия этой страницы.',
  },
  SessionRequired: {
    kind: 'login',
    title: 'Нужно войти',
    description: 'Чтобы открыть эту страницу, войдите в систему: кнопка «Войти» находится в меню слева.',
  },
  CredentialsSignin: {
    kind: 'login',
    title: 'Не удалось войти',
    description: 'Неверный email или пароль. Проверьте данные и попробуйте снова.',
  },
};

const FALLBACK = {
  kind: 'server' as const,
  title: 'Не удалось войти',
  description: 'Во время входа произошла ошибка. Возможно, сайт как раз обновлялся — подождите минуту и попробуйте ещё раз.',
};

const ICONS = { server: ServerCrash, access: ShieldAlert, login: KeyRound };

export default function AuthErrorPage({ searchParams }: { searchParams: { error?: string } }) {
  const code = typeof searchParams?.error === 'string' ? searchParams.error : null;
  const message = (code && MESSAGES[code]) || FALLBACK;

  return (
    <ErrorScreen icon={ICONS[message.kind]} title={message.title} description={message.description} code={code}>
      <Link href="/calendar" className={primaryButtonClass}>Вернуться в календарь</Link>
    </ErrorScreen>
  );
}
