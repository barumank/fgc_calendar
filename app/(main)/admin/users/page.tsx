import { Shield } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Shield className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Управление пользователями</h1>
      <p className="text-muted-foreground">Раздел в разработке</p>
    </div>
  );
}
