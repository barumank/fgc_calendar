import { Sidebar } from '@/src/components/layout/sidebar';
import { MainContent } from '@/src/components/layout/main-content';
import { SidebarLayoutProvider } from '@/src/components/layout/sidebar-layout-context';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D0D1A]">
      <SidebarLayoutProvider>
        <Sidebar />
        <MainContent>{children}</MainContent>
      </SidebarLayoutProvider>
    </div>
  );
}
