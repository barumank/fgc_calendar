import { NewsView } from './news-view';

export const metadata = {
  title: 'Новости',
  description: 'Новости проекта. Сообщения об обновлениях, ключевые новости СНГ файтинг сцены',
};

export default function NewsPage() {
  return <NewsView />;
}
