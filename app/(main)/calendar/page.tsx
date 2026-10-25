import { CalendarView } from './calendar-view';

export const metadata = {
  title: 'Календарь турниров',
  description: 'СНГ турниры по играм в жанре файтинг: Street Fighter 6, Guilty Gear Strive, Avatar Legends, Mortal Kombat, BlazBlue',
};

export default function CalendarPage() {
  return <CalendarView />;
}
