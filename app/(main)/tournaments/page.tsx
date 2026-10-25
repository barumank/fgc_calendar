import { Suspense } from 'react';
import { TournamentsView } from './tournaments-view';

export const metadata = {
  title: 'Турниры',
  description: 'Список СНГ турниров по играм в жанре файтинг.',
};

export default function TournamentsPage() {
  return (
    <Suspense>
      <TournamentsView />
    </Suspense>
  );
}
