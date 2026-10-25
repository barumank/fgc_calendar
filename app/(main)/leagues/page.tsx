import { LeaguesView } from './leagues-view';

export const metadata = {
  title: 'Лиги',
  description: 'Перечень действующих и прошедших лиг (регулярных длительных мероприятий) по играм жанра файтинг',
};

export default function LeaguesPage() {
  return <LeaguesView />;
}
