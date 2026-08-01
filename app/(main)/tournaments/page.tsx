import { Suspense } from 'react';
import { TournamentsView } from './tournaments-view';

export default function TournamentsPage() {
  return (
    <Suspense>
      <TournamentsView />
    </Suspense>
  );
}
