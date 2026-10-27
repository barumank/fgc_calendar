import Link from 'next/link';
import { Compass } from 'lucide-react';
import { ErrorScreen, primaryButtonClass, secondaryButtonClass } from '@/src/components/common/error-screen';

export const metadata = {
  title: 'Страница не найдена',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <ErrorScreen
      icon={Compass}
      title="Страница не найдена"
      description="Такой страницы нет: возможно, она переехала или в адресе опечатка."
      code="404"
    >
      <Link href="/calendar" className={primaryButtonClass}>Вернуться в календарь</Link>
      <Link href="/tournaments" className={secondaryButtonClass}>К турнирам</Link>
    </ErrorScreen>
  );
}
