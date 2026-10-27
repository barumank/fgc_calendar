import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Trophy } from 'lucide-react';

// Full-page layout shared by the sign-in error, 404 and runtime error pages:
// a centred card with the site logo, an icon, a message and action buttons.
export function ErrorScreen({ icon: Icon, title, description, code, children }: {
  icon: LucideIcon;
  title: string;
  description: string;
  code?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#0D0D1A]">
      <Link href="/calendar" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-[#EF4444] rounded-lg flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white tracking-wide">FIGHT<span className="text-[#EF4444]">NEXUS</span></div>
          <div className="text-[10px] text-muted-foreground tracking-[0.2em]">TOURNAMENTS</div>
        </div>
      </Link>

      <section className="w-full max-w-md bg-[#1A1A2E] rounded-xl border border-border/30 p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]">
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {children && <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">{children}</div>}
        {code && <p className="mt-6 text-xs text-muted-foreground/60">Код ошибки: {code}</p>}
      </section>
    </main>
  );
}

export const primaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-[#EF4444] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#DC2626]';
export const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-white/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10';
