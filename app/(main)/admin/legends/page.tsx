'use client';

import Image from 'next/image';
import { Mic, Pause, Play, Twitch, Volume2, VolumeX, Vote, X, Youtube } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';

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

interface LegendCardView {
  legendNumber: number;
  displayPosition: number;
  nickname: string;
  nomination: string;
  achievement: string;
  comment: string;
  imageData: string;
  podcastUrl: string | null;
  videoPodcastUrl: string | null;
  twitchUrl: string | null;
  youtubeChannelUrl: string | null;
  publishedAt: string;
}

function PodcastArtwork() {
  const bars = [16, 26, 40, 29, 52, 35, 62, 42, 29, 48, 34, 18];
  return <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-violet-400/60 bg-[radial-gradient(circle_at_50%_38%,rgba(194,75,255,.3),transparent_63%),linear-gradient(145deg,#201331,#121024)] shadow-[inset_0_0_22px_rgba(168,65,255,.2),0_0_18px_rgba(169,64,255,.16)]">
    <div className="absolute inset-x-2 top-1/2 flex -translate-y-1/2 items-center justify-between gap-[2px] opacity-70" aria-hidden="true">{bars.map((height, index) => <span key={index} className="w-[3px] rounded-full bg-fuchsia-500" style={{ height: `${height}%` }}/>)}</div>
    <Mic aria-hidden="true" className="relative z-10 h-[58%] w-[48%] stroke-[1.8] text-fuchsia-300 drop-shadow-[0_0_12px_rgba(204,77,255,.85)]"/>
  </div>;
}

function PodcastPanel({ title, duration, children }: { title: string; duration: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-violet-400/40 bg-[linear-gradient(120deg,rgba(36,22,57,.96),rgba(20,19,40,.98))] p-3 shadow-[0_0_25px_rgba(158,68,255,.16)] sm:p-4">
    <div className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5">
      <PodcastArtwork/>
      <div className="min-w-0"><div className="mb-2 flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs font-medium text-violet-300">Подкаст</p><p className="mt-1 truncate text-sm font-semibold text-white sm:text-base">{title}</p></div><span className="shrink-0 text-xs tabular-nums text-slate-300 sm:text-sm">{duration}</span></div>{children}</div>
    </div>
  </div>;
}

function PodcastWidget({ url, nickname }: { url: string; nickname: string }) {
  const podcastTitle = `Интервью с ${nickname}`;
  let parsed: URL | null = null;
  try { parsed = new URL(url); } catch { /* Let the player show an unavailable state for malformed links. */ }

  if (parsed?.hostname.endsWith('spotify.com')) {
    const embedUrl = parsed.href.replace('://open.spotify.com/', '://open.spotify.com/embed/');
    return <PodcastPanel title={podcastTitle} duration=""><iframe title={podcastTitle} src={embedUrl} width="100%" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="rounded-xl"/></PodcastPanel>;
  }
  if (parsed && (parsed.hostname === 'youtu.be' || parsed.hostname.endsWith('youtube.com') || parsed.hostname.endsWith('youtube-nocookie.com'))) {
    const videoId = parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v') || parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
    if (videoId) return <PodcastPanel title={podcastTitle} duration=""><iframe title={podcastTitle} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" className="aspect-video w-full rounded-xl"/></PodcastPanel>;
  }
  if (parsed?.hostname.endsWith('soundcloud.com')) {
    const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23b44dff&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false`;
    return <PodcastPanel title={podcastTitle} duration=""><iframe title={podcastTitle} src={embedUrl} width="100%" height="166" allow="autoplay" loading="lazy" className="rounded-xl"/></PodcastPanel>;
  }
  if (parsed?.hostname.endsWith('podcasts.apple.com')) {
    const embedUrl = parsed.href.replace('://podcasts.apple.com/', '://embed.podcasts.apple.com/');
    return <PodcastPanel title={podcastTitle} duration=""><iframe title={podcastTitle} src={embedUrl} width="100%" height="175" allow="autoplay *; encrypted-media *;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation" loading="lazy" className="rounded-xl"/></PodcastPanel>;
  }

  return <DirectAudioPlayer url={url} title={podcastTitle} />;
}

function DirectAudioPlayer({ url, title }: { url: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const formatTime = (value: number) => {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = Math.floor(value % 60);
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`;
  };
  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); setPlaying(true); } catch { setUnavailable(true); }
    } else { audio.pause(); setPlaying(false); }
  };
  const waveform = Array.from({ length: 72 }, (_, index) => {
    const progress = (index + 1) / 73;
    const envelope = 0.34 + 0.66 * Math.pow(Math.sin(Math.PI * progress), 0.7);
    const texture = 0.2 + 0.8 * Math.abs(Math.sin(index * 1.37) * 0.65 + Math.sin(index * 0.43) * 0.35);
    return Math.round(12 + 78 * envelope * texture);
  });
  return <>
    <audio ref={audioRef} src={url} preload="metadata" onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setUnavailable(true)} />
    <PodcastPanel title={title} duration={duration ? formatTime(duration) : '—:—'}>
    {unavailable ? <a href={url} target="_blank" rel="noreferrer" className="text-sm text-violet-200 underline underline-offset-4">Открыть подкаст по ссылке</a> : <div className="flex items-center gap-2 rounded-2xl border border-violet-300/20 bg-[#111020]/75 p-2 sm:gap-3 sm:p-3">
      <button type="button" onClick={() => void togglePlayback()} aria-label={playing ? 'Пауза' : 'Воспроизвести'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-fuchsia-300/70 bg-gradient-to-br from-violet-500/70 to-fuchsia-700/50 text-white shadow-[0_0_15px_rgba(195,92,255,.35)] sm:h-[52px] sm:w-[52px]">{playing ? <Pause className="h-5 w-5 fill-current sm:h-6 sm:w-6"/> : <Play className="ml-0.5 h-5 w-5 fill-current sm:h-6 sm:w-6"/>}</button>
      <div className="min-w-0 flex-1"><div className="relative flex h-10 w-full items-center gap-[2px] overflow-hidden" aria-hidden="true">{waveform.map((height, index) => <span key={index} className={`min-w-[2px] max-w-[6px] flex-1 rounded-full bg-gradient-to-t from-violet-500 via-fuchsia-400 to-fuchsia-200 ${playing && index / waveform.length < currentTime / (duration || 1) ? 'opacity-100' : 'opacity-65'}`} style={{ height: `${height}%` }}/>)}</div><input aria-label="Позиция воспроизведения" type="range" min={0} max={duration || 0} step={0.1} value={Math.min(currentTime, duration || 0)} onChange={(event) => { const time = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = time; setCurrentTime(time); }} className="h-1 w-full cursor-pointer accent-fuchsia-400"/><div className="mt-1 text-[11px] tabular-nums text-slate-400">{formatTime(currentTime)}</div></div>
      <button type="button" aria-label={muted ? 'Включить звук' : 'Выключить звук'} onClick={() => { if (audioRef.current) audioRef.current.muted = !muted; setMuted((value) => !value); }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-100 transition hover:bg-white/10 sm:h-12 sm:w-12">{muted ? <VolumeX className="h-6 w-6 sm:h-7 sm:w-7"/> : <Volume2 className="h-6 w-6 sm:h-7 sm:w-7"/>}</button>
    </div>}
    </PodcastPanel>
  </>;
}

function LegendPlaque({ number, nickname }: { number: number; nickname?: string }) {
  return (
    <div className="relative z-20 -mb-0.5 flex h-9 w-[60%] min-w-[120px] max-w-[220px] items-center justify-center">
      <svg viewBox="0 0 220 40" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,.7)]">
        <path d="M21 1.5H199L218.5 20 199 38.5H21L1.5 20Z" fill="#181827" stroke="#818394" strokeWidth="1.7" />
        <path d="M23 5H197L212 20 197 35H23L8 20Z" fill="none" stroke="#3e4052" strokeWidth="1.2" />
      </svg>
      <span className="relative z-10 max-w-[90%] truncate text-sm font-semibold leading-none text-slate-100">{nickname || `Легенда #${number}`}</span>
    </div>
  );
}

export default function AdminLegendsPage() {
  const { data: session, status } = useSession();
  const [voteOpen, setVoteOpen] = useState(false);
  const [round, setRound] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loadingVote, setLoadingVote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState('');
  const [comment, setComment] = useState('');
  const [roundStatus, setRoundStatus] = useState<'open' | 'processing' | 'published'>('open');
  const [deadlineAt, setDeadlineAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(['—', '—', '—', '—']);
  const [publishedCards, setPublishedCards] = useState<LegendCardView[]>([]);
  const [selectedCard, setSelectedCard] = useState<LegendCardView | null>(null);

  useEffect(() => {
    let mounted = true;
    const refreshPublicData = async () => {
      try {
        const response = await fetch('/next-api/legends', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (!mounted) return;
        setRound(data.activeLegendNumber);
        setRoundStatus(data.status);
        setDeadlineAt(data.deadlineAt);
        setPublishedCards(data.cards);
      } catch { /* Keep the initial display available if the status request fails. */ }
    };
    void refreshPublicData();
    const refreshTimer = window.setInterval(() => { void refreshPublicData(); }, 15_000);
    return () => { mounted = false; window.clearInterval(refreshTimer); };
  }, []);

  useEffect(() => {
    if (!deadlineAt || roundStatus !== 'open') {
      setCountdown(['00', '00', '00', '00']);
      return;
    }
    const update = () => {
      const seconds = Math.max(0, Math.floor((new Date(deadlineAt).getTime() - Date.now()) / 1000));
      setCountdown([String(Math.floor(seconds / 86400)).padStart(2, '0'), String(Math.floor((seconds % 86400) / 3600)).padStart(2, '0'), String(Math.floor((seconds % 3600) / 60)).padStart(2, '0'), String(seconds % 60).padStart(2, '0')]);
      if (seconds === 0) setRoundStatus('processing');
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [deadlineAt, roundStatus]);

  const openVote = async () => {
    if (status === 'loading') return;
    if (!session) {
      showToast('Для голосования необходимо авторизоваться', 'info');
      return;
    }
    setVoteOpen(true);
    setLoadingVote(true);
    try {
      const response = await fetch('/next-api/legend-votes', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить голосование');
      setRound(data.legendNumber);
      setRoundStatus(data.status);
      setDeadlineAt(data.deadlineAt);
      setHasVoted(data.hasVoted);
      if (data.status !== 'open') {
        showToast(data.status === 'processing' ? 'Голосование завершено, результаты обрабатываются' : 'Эта легенда уже опубликована', 'info');
        setVoteOpen(false);
      }
    } catch (error) {
      setVoteOpen(false);
      showToast(error instanceof Error ? error.message : 'Ошибка загрузки голосования', 'error');
    } finally {
      setLoadingVote(false);
    }
  };

  const submitVote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (round === null) return;
    setSubmitting(true);
    try {
      const response = await fetch('/next-api/legend-votes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, role, comment, legendNumber: round }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось принять голос');
      setHasVoted(true);
      showToast('Ваш голос принят', 'success');
      setVoteOpen(false);
      setNickname(''); setRole(''); setComment('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Ошибка отправки голоса', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
              <h2 className="text-xl font-semibold leading-tight sm:text-2xl">{roundStatus === 'processing' ? <>Голосование за Легенду # {round ?? '…'} завершено.</> : roundStatus === 'published' ? 'Помогите нам выбрать следующую Легенду СНГ ФГЦ.' : 'Скоро будет раскрыта новая легенда!'}</h2>
              <p className="mt-3 max-w-md text-sm font-normal leading-relaxed text-slate-200">{roundStatus === 'processing' ? `После обработки результатов, карточка Легенды # ${round ?? '…'} откроется и вы узнаете кто был выбран.` : roundStatus === 'published' ? 'Голосование будет открыто в ближайшее время.' : 'Голосование за следующую легенду открыто. Предложите кандидата и расскажите, почему он достоин этого звания.'}</p>
            </div>
            <div className="border-t border-violet-200/20 pt-4 text-center md:border-l md:border-t-0 md:pl-5 md:pt-0 lg:pl-7">
              <p className="mb-2 text-sm text-slate-100">{roundStatus === 'open' ? 'До завершения голосования:' : roundStatus === 'processing' ? 'Голосование завершено' : 'Новая легенда опубликована'}</p>
              <div className="flex justify-center gap-2"><CountdownTile value={roundStatus === 'open' ? countdown[0] : '—'} label="дня"/><CountdownTile value={roundStatus === 'open' ? countdown[1] : '—'} label="часов"/><CountdownTile value={roundStatus === 'open' ? countdown[2] : '—'} label="минут"/><CountdownTile value={roundStatus === 'open' ? countdown[3] : '—'} label="секунд"/></div>
              <button type="button" disabled={roundStatus !== 'open'} onClick={openVote} className="mt-4 inline-flex min-w-[210px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{roundStatus === 'open' ? <><Vote className="h-4 w-4"/>Проголосовать</> : roundStatus === 'processing' ? 'Голосование завершено' : 'Следующий раунд скоро'}</button>
            </div>
          </div>
        </section>

        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="border-l-[3px] border-rose-500 pl-3 text-lg font-bold sm:text-xl">Все легенды СНГ ФГЦ</h2>
          <p className="text-xs text-slate-100 sm:text-sm">Открыто легенд: <span className="font-bold text-rose-400">{publishedCards.length} из 24</span></p>
        </div>
        <section aria-label="Закрытые карточки легенд" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 24 }, (_, index) => {
            const number = index + 1;
            const card = publishedCards.find((published) => published.displayPosition === number);
            return <article key={number} className="group relative flex h-[135px] flex-col items-center justify-end overflow-hidden rounded-[10px] border border-violet-200/[.08] bg-[linear-gradient(145deg,rgba(26,26,45,.96),rgba(23,22,41,.96)_58%,rgba(32,25,49,.96))] px-2 pb-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.025)] transition-colors hover:border-violet-300/25">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(167,139,250,.17),transparent_62%)]"/>
              {card ? <><button type="button" aria-label={`Открыть карточку легенды ${card.nickname}`} onClick={() => setSelectedCard(card)} className="absolute inset-0 z-10"><img src={card.imageData} alt={card.nickname} className="h-full w-full object-cover object-center opacity-85"/><span className="absolute inset-0 bg-gradient-to-t from-[#10101e] via-transparent to-transparent"/></button><LegendPlaque number={number} nickname={card.nickname}/></> : <><div className="absolute top-[4px] z-0 opacity-85 grayscale"><MysteryPortrait/></div><LegendPlaque number={number}/></>}
            </article>;
          })}
        </section>
      </div>
      <Modal isOpen={voteOpen} onClose={() => setVoteOpen(false)} title={`Голосование за легенду №${round ?? '…'}`} maxWidth="max-w-xl">
        {loadingVote ? <p className="py-5 text-center text-slate-300">Загружаем форму…</p> : hasVoted ? (
          <div className="py-5 text-center text-slate-200">Вы уже проголосовали за легенду №{round}. Новый голос можно будет оставить после открытия следующего раунда.</div>
        ) : (
          <form className="space-y-4" onSubmit={submitVote}>
            <label className="block text-sm font-medium text-slate-200">Никнейм героя
              <input required maxLength={64} value={nickname} onChange={(event) => setNickname(event.target.value.replace(/[^\p{L}\p{N}_ -]/gu, ''))} className="mt-1.5 w-full rounded-lg border border-violet-300/20 bg-[#10101f] px-3 py-2.5 text-white outline-none focus:border-violet-400" placeholder="Введите никнейм" />
              <span className="mt-1 block text-xs text-slate-400">Буквы, цифры, дефис, подчёркивание и пробел.</span>
            </label>
            <label className="block text-sm font-medium text-slate-200">Роль
              <select required value={role} onChange={(event) => setRole(event.target.value)} className="mt-1.5 w-full rounded-lg border border-violet-300/20 bg-[#10101f] px-3 py-2.5 text-white outline-none focus:border-violet-400">
                <option value="">Выберите роль</option><option value="player">Игрок</option><option value="organizer">Турнирный организатор</option><option value="content_maker">Контент-мейкер</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-200">Почему этот человек достоин стать легендой ФГЦ?
              <textarea required maxLength={5000} rows={5} value={comment} onChange={(event) => setComment(event.target.value)} className="mt-1.5 w-full resize-y rounded-lg border border-violet-300/20 bg-[#10101f] px-3 py-2.5 text-white outline-none focus:border-violet-400" placeholder="Опишите заслуги и вклад кандидата" />
            </label>
            <button disabled={submitting} type="submit" className="w-full rounded-lg bg-gradient-to-r from-rose-600 to-red-500 px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{submitting ? 'Отправляем…' : 'Проголосовать'}</button>
          </form>
        )}
      </Modal>
      <Modal isOpen={!!selectedCard} onClose={() => setSelectedCard(null)} maxWidth="max-w-7xl">
        {selectedCard && <div className="relative -mx-6 -my-4 max-h-[88vh] min-h-[660px] overflow-y-auto overflow-x-hidden rounded-[26px] bg-[#100c1c] p-5 sm:p-8 lg:p-10">
          <Image src="/images/legends/profile_card_background.png" alt="" aria-hidden="true" fill sizes="(max-width: 1280px) 96vw, 1280px" className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill"/>
          <button type="button" aria-label="Закрыть карточку" onClick={() => setSelectedCard(null)} className="absolute right-4 top-4 z-30 rounded-full p-2 text-slate-200 transition hover:bg-white/10 hover:text-white"><X className="h-6 w-6"/></button>
          <div className="relative z-10 grid items-stretch gap-5 md:min-h-[580px] md:grid-cols-[minmax(300px,.82fr)_minmax(0,1.35fr)] md:gap-8 lg:gap-12">
            <div className="relative mx-auto w-full max-w-[380px] pt-[30px] pb-[150px]">
              <div className="relative aspect-[3/4] w-full">
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-fuchsia-300 via-violet-400 to-fuchsia-300 drop-shadow-[0_0_15px_rgba(222,114,255,.65)] [clip-path:polygon(15%_0,85%_0,100%_11%,100%_100%,0_100%,0_11%)]"/>
                <div className="absolute inset-[3px] overflow-hidden bg-[#100c20] [clip-path:polygon(15%_0,85%_0,100%_11%,100%_100%,0_100%,0_11%)]">
                  <img src={selectedCard.imageData} alt={selectedCard.nickname} className="h-full w-full object-cover object-center"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-violet-950/35 via-transparent to-fuchsia-950/10"/>
                </div>
                <div className="absolute left-1/2 top-[68%] z-20 aspect-[561/328] w-[122%] -translate-x-1/2">
                  <Image src="/images/legends/profile_laurels_with_trophy.png" alt="" aria-hidden="true" fill sizes="(max-width: 768px) 360px, 550px" className="object-contain"/>
                </div>
              </div>
              {(selectedCard.twitchUrl || selectedCard.youtubeChannelUrl) && <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center gap-3">
                {selectedCard.twitchUrl && <a href={selectedCard.twitchUrl} target="_blank" rel="noopener noreferrer" aria-label={`Twitch ${selectedCard.nickname}`} title="Открыть Twitch" className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-300/50 bg-[#171126]/95 text-violet-200 shadow-[0_0_18px_rgba(168,85,247,.35)] transition hover:scale-105 hover:text-white"><Twitch className="h-6 w-6"/></a>}
                {selectedCard.youtubeChannelUrl && <a href={selectedCard.youtubeChannelUrl} target="_blank" rel="noopener noreferrer" aria-label={`YouTube ${selectedCard.nickname}`} title="Открыть канал YouTube" className="flex h-11 w-11 items-center justify-center rounded-full border border-rose-300/50 bg-[#171126]/95 text-rose-300 shadow-[0_0_18px_rgba(239,68,68,.3)] transition hover:scale-105 hover:text-white"><Youtube className="h-6 w-6"/></a>}
              </div>}
            </div>
            <div className="min-w-0 pb-4 pt-2 md:flex md:self-stretch md:flex-col md:pt-6">
              <h2 className="break-words pr-8 text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_18px_rgba(200,154,255,.2)] sm:text-5xl lg:text-6xl">{selectedCard.nickname}</h2>
              <div className="relative mx-auto mt-4 aspect-[5/1] w-full max-w-[560px] md:mx-0">
                <Image src="/images/legends/nomination_badge.png" alt="" aria-hidden="true" fill sizes="(max-width: 768px) 90vw, 560px" className="object-cover object-center"/>
                <span className="absolute inset-y-0 left-[22%] right-[4%] flex items-center justify-center px-3 text-center text-base font-bold text-amber-300 drop-shadow-[0_1px_5px_rgba(255,184,36,.5)] sm:text-lg lg:text-xl">{selectedCard.nomination}</span>
              </div>
              <div className="my-4 h-px bg-gradient-to-r from-fuchsia-400/80 via-violet-300/60 to-transparent lg:my-5"/>
              <h3 className="border-l-4 border-rose-500 pl-4 text-xl font-bold text-white sm:text-2xl">Заслуги и вклад в развитие сцены</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-100 sm:text-base lg:text-lg">{selectedCard.comment || selectedCard.achievement}</p>
              {(selectedCard.videoPodcastUrl || selectedCard.podcastUrl) && <div className="mt-4 md:mt-auto md:pt-8"><PodcastWidget url={selectedCard.videoPodcastUrl || selectedCard.podcastUrl || ''} nickname={selectedCard.nickname}/></div>}
            </div>
          </div>
        </div>}
      </Modal>
    </main>
  );
}
