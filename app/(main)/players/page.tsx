import { PlayersView } from './players-view';

export const metadata = {
  title: 'Игроки',
  description: 'Перечень игроков, победители СНГ турниров, попавшие в топ-8',
};

export default function PlayersPage() {
  return <PlayersView />;
}
