import { HeaderActions } from '@/src/components/layout/header-actions';

export const metadata = {
  title: 'Поддержать проект — FightNexus',
  description: 'Как поддержать FGC-calendar донатом.',
};

export default function SupportPage() {
  return (
    <div className="px-6 pt-6 pb-12">
      <div className="flex justify-end mb-6"><HeaderActions /></div>
      <h1 className="text-2xl font-bold text-foreground">Поддержать проект</h1>
      <p className="text-sm text-muted-foreground mt-1 max-w-xl">
        Раздел в разработке.
      </p>
    </div>
  );
}
