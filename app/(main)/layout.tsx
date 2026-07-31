import { Sidebar } from '@/src/components/layout/sidebar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0D0D1F] text-white">
      <Sidebar />
      <main className="ml-[240px] p-6">
        {children}
      </main>
    </div>
  )
}
