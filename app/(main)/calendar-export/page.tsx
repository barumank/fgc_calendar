import { CalendarExportView } from './calendar-export-view';

export const metadata = {
  title: 'Экспорт',
  description: 'Функционал экспорта календарных событий в дискорд, и календари пользователей.',
};

export default function CalendarExportPage() {
  return <CalendarExportView />;
}
