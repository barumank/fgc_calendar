export type NewsCategory = 'announcement' | 'results' | 'update' | 'interview';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  category: NewsCategory;
}

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  announcement: 'Анонс',
  results: 'Результаты',
  update: 'Обновление',
  interview: 'Интервью',
};
