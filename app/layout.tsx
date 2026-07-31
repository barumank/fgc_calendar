import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FGC Calendar',
  description: 'Fighting Game Community Tournament Calendar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-[#0D0D1F] text-white antialiased">{children}</body>
    </html>
  )
}
