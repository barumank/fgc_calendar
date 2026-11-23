import Image from 'next/image';
import { LockKeyhole } from 'lucide-react';

function MysteryPortrait({ large = false }: { large?: boolean }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center ${large ? 'h-[220px] w-[340px] translate-y-[14px] sm:h-[230px] sm:w-[360px]' : 'h-[96px] w-[144px]'}`}>
      <Image
        src="/images/legends/legend_mystery_placeholder.png"
        alt=""
        aria-hidden="true"
        fill
        sizes={large ? '(max-width: 768px) 340px, 360px' : '144px'}
        className={`object-contain mix-blend-screen ${large ? 'scale-[1.25] drop-shadow-[0_0_18px_rgba(139,62,255,.28)]' : 'grayscale opacity-70'}`}
      />
    </div>
  );
}
function MonthBadge() {
  return (
    <div className="absolute left-1/2 top-0 z-20 flex h-[60px] w-[min(390px,78vw)] -translate-x-1/2 -translate-y-1/2 items-center justify-center drop-shadow-[0_0_12px_rgba(248,183,48,.2)]">
      <svg viewBox="0 0 390 60" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <path d="M34 2H356L388 30 356 58H34L2 30Z" fill="#201a24" stroke="#f7bd35" strokeWidth="2.5" />
        <path d="M38 6H352L378 30 352 54H38L12 30Z" fill="none" stroke="#745927" strokeWidth="1" />
      </svg>
      <span className="relative px-6 text-center text-lg font-bold text-amber-300 sm:text-2xl">Легенда этого месяца</span>
    </div>
  );
}
function CountdownTile({ value, label }: { value: string; label: string }) {
  return <div className="min-w-[58px] rounded-xl border border-violet-300/10 bg-[#17172d]/90 px-2.5 py-2 text-center shadow-inner shadow-white/[.02] sm:min-w-[68px] sm:px-3"><div className="text-xl font-bold tabular-nums text-white sm:text-2xl">{value}</div><div className="mt-0.5 text-[10px] font-medium text-slate-400 sm:text-xs">{label}</div></div>;
}

function LegendPlaque({ number }: { number: number }) {
  return (
    <div className="relative z-20 -mb-0.5 flex h-9 w-[60%] min-w-[120px] max-w-[220px] items-center justify-center">
      <svg viewBox="0 0 220 40" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,.7)]">
        <path d="M21 1.5H199L218.5 20 199 38.5H21L1.5 20Z" fill="#181827" stroke="#818394" strokeWidth="1.7" />
        <path d="M23 5H197L212 20 197 35H23L8 20Z" fill="none" stroke="#3e4052" strokeWidth="1.2" />
      </svg>
      <span className="relative z-10 max-w-[90%] truncate text-sm font-semibold leading-none text-slate-100">Легенда #{number}</span>
    </div>
  );
}

export default function AdminLegendsPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#0c0c19] px-4 pb-12 pt-5 font-montserrat text-white sm:px-7 lg:px-[80px]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_2%,rgba(76,50,130,.32),transparent_42%),linear-gradient(180deg,#101020_0%,#0b0b17_75%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-[650px] overflow-hidden md:block lg:h-[760px]">
        <div className="absolute inset-y-0 left-0 w-[54%]">
          <Image src="/images/legends/legend_header_left_fighter.png" alt="" fill priority sizes="54vw" className="object-cover object-left-top" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0c0c19]/70" />
        </div>
        <div className="absolute inset-y-0 right-0 w-[54%]">
          <Image src="/images/legends/legend_header_right_fighter.png" alt="" fill priority sizes="54vw" className="object-cover object-right-top" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#0c0c19]/70" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,12,25,0)_35%,rgba(12,12,25,.32)_76%,#0c0c19_100%),linear-gradient(90deg,rgba(12,12,25,0)_0%,rgba(12,12,25,.18)_36%,rgba(12,12,25,.5)_50%,rgba(12,12,25,.18)_64%,rgba(12,12,25,0)_100%)]" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[300px] -z-10 h-[540px] bg-[radial-gradient(ellipse_at_50%_25%,rgba(34,25,63,.3),transparent_68%)]" />

      <div className="relative mx-auto w-full max-w-none pt-[50px]">
        <header className="relative mx-auto mb-8 max-w-[820px] text-center lg:mb-[70px]">
          <Image src="/images/legends/header-laurels.png" alt="" aria-hidden="true" width={720} height={140} className="pointer-events-none absolute left-1/2 top-[-9px] z-0 hidden max-w-none -translate-x-1/2 lg:block" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight drop-shadow-[0_2px_14px_rgba(167,139,250,.3)] sm:text-4xl lg:text-[42px]">Легенды СНГ ФГЦ</h1>
            <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-200 sm:text-base">Игроки, организаторы, комментаторы и создатели контента,<br className="hidden sm:block"/> внёсшие значимый вклад в развитие файтинг-сцены СНГ</p>
          </div>
        </header>

        <section className="relative mx-auto mb-6 max-w-[1230px] rounded-[18px] border border-violet-400/70 bg-[linear-gradient(110deg,rgba(36,24,63,.95),rgba(17,17,34,.98)_53%,rgba(30,19,47,.96))] px-2 pb-4 pt-5 shadow-[0_0_18px_rgba(198,85,222,.16),0_12px_50px_rgba(0,0,0,.25),inset_0_0_35px_rgba(167,139,250,.08)] sm:px-3 sm:pb-5 lg:px-4">
          <MonthBadge />
          <div className="grid items-center gap-2 pt-2 md:grid-cols-[.95fr_1.2fr_1.15fr] lg:gap-3 2xl:grid-cols-[320px_minmax(0,1fr)_360px]">
            <div className="hidden items-center justify-center md:flex"><MysteryPortrait large /></div>
            <div className="text-center md:text-left">
              <h2 className="text-xl font-semibold leading-tight sm:text-2xl">Скоро будет раскрыта<br className="hidden lg:block"/> новая легенда!</h2>
              <p className="mt-3 max-w-md text-sm font-normal leading-relaxed text-slate-200">Здесь будут представлены люди, которые внесли значимый вклад в развитие ФГЦ-сцены СНГ.<br className="hidden lg:block"/> Голосование появится после публичного запуска раздела.</p>
            </div>
            <div className="border-t border-violet-200/20 pt-4 text-center md:border-l md:border-t-0 md:pl-5 md:pt-0 lg:pl-7">
              <p className="mb-2 text-sm text-slate-100">До подведения итогов голосования:</p>
              <div className="flex justify-center gap-2"><CountdownTile value="—" label="дня"/><CountdownTile value="—" label="часов"/><CountdownTile value="—" label="минут"/><CountdownTile value="—" label="секунд"/></div>
              <div className="mt-4 inline-flex min-w-[210px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-950/30"><LockKeyhole className="h-4 w-4"/>Голосование закрыто</div>
            </div>
          </div>
        </section>

        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="border-l-[3px] border-rose-500 pl-3 text-lg font-bold sm:text-xl">Все легенды СНГ ФГЦ</h2>
          <p className="text-xs text-slate-100 sm:text-sm">Открыто легенд: <span className="font-bold text-rose-400">0 из 24</span></p>
        </div>
        <section aria-label="Закрытые карточки легенд" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 24 }, (_, index) => (
            <article key={index} className="group relative flex h-[135px] flex-col items-center justify-end overflow-hidden rounded-[10px] border border-violet-200/[.08] bg-[linear-gradient(145deg,rgba(26,26,45,.96),rgba(23,22,41,.96)_58%,rgba(32,25,49,.96))] px-2 pb-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.025)] transition-colors hover:border-violet-300/25">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(167,139,250,.17),transparent_62%)]"/>
              <div className="absolute top-[4px] z-0 opacity-85 grayscale"><MysteryPortrait/></div>
              <LegendPlaque number={index + 1} />
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
