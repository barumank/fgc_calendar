import { Shield } from 'lucide-react';
import { HeaderActions } from '@/src/components/layout/header-actions';

export default function AdminUsersPage() {
  return (
    <div className="px-6 pt-6">
      <div className="flex justify-end mb-6"><HeaderActions /></div>
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Управление пользователями</h1>
        <p className="text-muted-foreground">Раздел в разработке</p>
      </div>
    </div>
  );
}
