'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { ErrorScreen, primaryButtonClass, secondaryButtonClass } from '@/src/components/common/error-screen';

// Shown when a page crashes while rendering; `reset` re-renders the segment.
export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      icon={TriangleAlert}
      title="Что-то пошло не так"
      description="Страница не смогла загрузиться. Попробуйте обновить её — если ошибка повторяется, сообщите нам, указав код ниже."
      code={error.digest ?? null}
    >
      <button onClick={reset} className={primaryButtonClass}>Обновить страницу</button>
      <Link href="/calendar" className={secondaryButtonClass}>В календарь</Link>
    </ErrorScreen>
  );
}
