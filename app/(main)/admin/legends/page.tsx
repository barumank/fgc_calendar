import Image from 'next/image';
import { Award, LockKeyhole } from 'lucide-react';

function LaurelWreath({ large = false }: { large?: boolean }) {
  return (
    <svg viewBox="0 0 180 150" aria-hidden="true" className={`absolute ${large ? 'h-40 w-48 sm:h-48 sm:w-56' : 'h-12 w-14'}`}>
      <g fill="currentColor" opacity=".88">
        <path d="M36 128c-16-18-25-43-22-70 10 9 18 21 20 36 5-10 10-17 18-23 3 14-2 27-13 36 8-3 17-4 25-2-8 12-18 19-32 20z"/>
        <path d="M45 83c-12-14-17-31-14-50 9 8 14 19 15 30 5-7 11-12 18-15 1 11-4 21-14 27 7-1 13 0 20 3-8 7-16 10-25 5z"/>
        <path d="M62 49C52 38 48 23 50 8c8 6 12 15 13 24 4-6 9-9 15-11 0 9-4 16-12 21 6 0 11 1 16 4-7 5-13 7-20 3z"/>
        <path d="M144 128c16-18 25-43 22-70-10 9-18 21-20 36-5-10-10-17-18-23-3 14 2 27 13 36-8-3-17-4-25-2 8 12 18 19 32 20z"/>
        <path d="M135 83c12-14 17-31 14-50-9 8-14 19-15 30-5-7-11-12-18-15-1 11 4 21 14 27-7-1-13 0-20 3 8 7 16 10 25 5z"/>
        <path d="M118 49c10-11 14-26 12-41-8 6-12 15-13 24-4-6-9-9-15-11 0 9 4 16 12 21-6 0-11 1-16 4 7 5 13 7 20 3z"/>
      </g>
      <path d="M36 133c-10-33-9-63 3-91m105 91c10-33 9-63-3-91" fill="none" stroke="currentColor" strokeWidth="2" opacity=".55"/>
    </svg>
  );
}

function MysteryPortrait({ large = false }: { large?: boolean }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center text-violet-200 ${large ? 'h-48 w-56 sm:h-52 sm:w-60' : 'h-[72px] w-28'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(168,85,247,.45),transparent_65%)]" />
      <LaurelWreath large={large} />
      <svg viewBox="0 0 140 170" aria-hidden="true" className={`relative z-10 h-full w-auto drop-shadow-[0_0_20px_rgba(147,51,234,.7)] ${large ? 'mt-8' : 'mt-5'}`}>
        <path d="M70 9C48 9 39 26 39 49c0 17 6 30 16 37l-3 11c-6 7-16 12-29 17C9 120 4 133 2 151l-2 19h140l-2-19c-2-18-7-31-21-37-13-5-23-10-29-17l-3-11c10-7 16-20 16-37C101 26 92 9 70 9z" fill="#100d20" stroke="#b88cff" strokeOpacity=".45" strokeWidth="2" />
        <text x="70" y="143" textAnchor="middle" fill="#eee7ff" fontSize={large ? 47 : 34} fontWeight="700">?</text>
      </svg>
    </div>
  );
}

function CountdownTile({ value, label }: { value: string; label: string }) {
  return <div className="min-w-[58px] rounded-xl border border-violet-300/10 bg-[#17172d]/90 px-2.5 py-2 text-center shadow-inner shadow-white/[.02] sm:min-w-[68px] sm:px-3"><div className="text-xl font-bold tabular-nums text-white sm:text-2xl">{value}</div><div className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">{label}</div></div>;
}

export default function AdminLegendsPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#0c0c19] px-4 pb-12 pt-5 text-white sm:px-7 lg:px-[80px]">
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

      <div className="relative mx-auto w-full max-w-none">
        <header className="relative mx-auto mb-8 max-w-2xl text-center lg:mb-[70px]">
          <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-[0_2px_14px_rgba(167,139,250,.3)] sm:text-4xl lg:text-[42px]">Легенды СНГ ФГЦ</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">Игроки, организаторы, комментаторы и создатели контента,<br className="hidden sm:block"/> внёсшие значимый вклад в развитие файтинг-сцены СНГ</p>
        </header>

        <section className="relative mx-auto mb-6 max-w-[1350px] rounded-[18px] border border-amber-400/60 bg-[linear-gradient(110deg,rgba(36,24,63,.95),rgba(17,17,34,.98)_53%,rgba(30,19,47,.96))] px-4 pb-4 pt-5 shadow-[0_12px_50px_rgba(0,0,0,.25),inset_0_0_35px_rgba(167,139,250,.08)] sm:px-6 sm:pb-5 lg:px-8">
          <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-amber-400/80 bg-[#171526] px-7 py-1 text-base font-bold text-amber-300 shadow-[0_0_20px_rgba(251,191,36,.18)] sm:text-xl">Легенда этого месяца</div>
          <div className="grid items-center gap-4 pt-2 md:grid-cols-[.95fr_1.2fr_1.15fr] lg:gap-6">
            <div className="hidden items-center justify-center md:flex"><MysteryPortrait large /></div>
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold leading-tight sm:text-2xl">Скоро будет раскрыта<br className="hidden lg:block"/> новая легенда!</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-200">Здесь будут представлены люди, которые внесли значимый вклад в развитие ФГЦ-сцены СНГ.<br className="hidden lg:block"/> Голосование появится после публичного запуска раздела.</p>
            </div>
            <div className="border-t border-violet-200/20 pt-4 text-center md:border-l md:border-t-0 md:pl-5 md:pt-0 lg:pl-7">
              <p className="mb-2 text-sm text-slate-100">До подведения итогов голосования:</p>
              <div className="flex justify-center gap-2"><CountdownTile value="—" label="дня"/><CountdownTile value="—" label="часов"/><CountdownTile value="—" label="минут"/><CountdownTile value="—" label="секунд"/></div>
              <div className="mt-4 inline-flex min-w-[210px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/30"><LockKeyhole className="h-4 w-4"/>Голосование закрыто</div>
            </div>
          </div>
        </section>

        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="border-l-[3px] border-rose-500 pl-3 text-lg font-bold sm:text-xl">Все легенды СНГ ФГЦ</h2>
          <p className="text-xs text-slate-100 sm:text-sm">Открыто легенд: <span className="font-bold text-rose-400">0 из 24</span></p>
        </div>
        <section aria-label="Закрытые карточки легенд" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 24 }, (_, index) => (
            <article key={index} className="group relative flex h-[124px] flex-col items-center justify-end overflow-hidden rounded-[10px] border border-violet-200/[.08] bg-[linear-gradient(145deg,rgba(26,26,45,.96),rgba(23,22,41,.96)_58%,rgba(32,25,49,.96))] px-2 pb-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.025)] transition-colors hover:border-violet-300/25">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(167,139,250,.17),transparent_62%)]"/>
              <div className="absolute top-[-3px] opacity-85 grayscale"><MysteryPortrait/></div>
              <div className="relative z-10 -mb-0.5 min-w-[122px] rounded-full border border-slate-400/40 bg-[#171626]/95 px-4 py-1 text-center text-xs font-semibold shadow-md shadow-black/30">Легенда #{index + 1}</div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
