import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="px-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Settings className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Настройки</h1>
      <p className="text-muted-foreground">Раздел в разработке</p>
    </div>
  );
}
