import { Sidebar } from '@/src/components/layout/sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D0D1A]">
      <Sidebar />
      <div className="ml-[240px] flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
