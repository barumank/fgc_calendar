import { RankingsView } from './rankings-view';

export const metadata = {
  title: 'Рейтинг',
  description: 'Рейтинг игроков в соответствии с их призовыми местами на прошедших турнирах',
};

export default function RankingsPage() {
  return <RankingsView />;
}
