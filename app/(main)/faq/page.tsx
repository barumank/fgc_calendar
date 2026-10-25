import type { ReactNode } from 'react';
import { Heart, Info, ListChecks, Sparkles, Trophy } from 'lucide-react';
import { HeaderActions } from '@/src/components/layout/header-actions';
import { specialThanks, supporters } from '@/src/data/supporters';

export const metadata = {
  title: 'FAQ — FightNexus',
  description: 'FGC-calendar — календарь турниров по файтингам на территории СНГ и других стран. Как пользоваться сервисом, что он умеет и как с нами связаться.',
};

const functionality = [
  {
    title: 'Организатору турниров',
    items: [
      'Сообщите о своём турнире через форму «Сообщить о турнире» — после проверки модератором он появится в календаре.',
      'Добавьте баннер 16:9, ссылки на регистрацию, трансляцию и Discord, чтобы привлечь больше участников.',
      'Результаты турниров (топ-8) подтягиваются автоматически из Challonge, start.gg и crowdhype.',
      'Игроки, подписанные на дисциплину, получают уведомление о вашем турнире в телеграм.',
    ],
  },
  {
    title: 'Игроку',
    items: [
      'Календарь, список турниров и лиги доступны без регистрации — даже неавторизованным пользователям.',
      'Фильтры по дисциплинам и регионам помогают быстро найти подходящие турниры.',
      'Добавляйте турниры в календарь Яндекс и Google в один клик.',
      'Подписка на дисциплины и напоминания от телеграм-бота о дате и времени начала турниров (нужна авторизация).',
      'Личный рейтинг игроков по каждой дисциплине.',
    ],
  },
  {
    title: 'Владельцу Discord-сервера',
    items: [
      'Выгружайте информацию о турнирах в собственный Discord-сервер буквально в пару кликов.',
      'Выбирайте, какие дисциплины и регионы попадут в выгрузку.',
      'Турниры создаются как события вашего сервера, а уже выгруженные отмечаются в списке пометкой «уже в Discord».',
      'Для этого достаточно пригласить нашего бота на сервер и указать его ID на странице «Экспорт календаря».',
    ],
  },
];

const rankingPoints = [
  { place: '1 место', points: 16 },
  { place: '2 место', points: 12 },
  { place: '3 место', points: 8 },
  { place: '4 место', points: 6 },
  { place: '5–8 места', points: 4 },
];

function Card({ icon, title, subtitle, badge, children }: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground leading-9">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground -mt-1">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

export default function FaqPage() {
  return (
    <div className="px-6 pt-6 pb-12">
      <div className="flex justify-end mb-6"><HeaderActions /></div>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FAQ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всё о FGC-calendar: что умеет сервис, как считается рейтинг и кто помогает проекту развиваться.
          </p>
        </div>

        <div className="grid gap-5 2xl:grid-cols-[2fr_3fr]">
          <Card icon={<Info size={18} />} title="О проекте">
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">FGC-calendar</span> (фгц-календарь) — это инструмент
                для отслеживания турниров по играм в жанре файтинг на территории СНГ и других стран.
              </p>
              <p>
                Вы можете сообщать о турнирах, известных вам, рекламировать свои турниры, добавлять найденные турниры
                к себе в календарь Яндекс и Гугл, а также выгружать информацию о турнирах в собственный дискорд-сервер
                буквально в пару кликов.
              </p>
              <p>
                Календарь не требует обязательной регистрации. Все турниры видны даже не авторизованным пользователям.
                Авторизация требуется только в случае, если вы захотите настроить автоматические уведомления от нашего
                телеграм бота к вам, с напоминанием о дате и времени начала предстоящих, интересующих вас, турниров.
              </p>
              <div className="rounded-lg border border-border/30 bg-white/[0.03] p-4">
                <p>
                  <span className="font-semibold text-foreground">Сервис не требует никакой оплаты.</span> Мы не
                  рекламируем никакую продукцию и не принимаем рекламу на размещение. Календарь полностью бесплатный и
                  поддерживает развитие Файтинг Гейм Комьюнити на территории русскоговорящих стран.
                </p>
              </div>
              <p>
                Вопросы и предложения направляйте, пожалуйста, в телеграм чат{' '}
                <a
                  href="https://t.me/jackwolf357"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#229ED9] hover:underline"
                >
                  t.me/jackwolf357
                </a>
                .
              </p>
            </div>
          </Card>

          <Card icon={<ListChecks size={18} />} title="Функционал" subtitle="Что сервис умеет для разных участников сообщества">
            <div className="grid gap-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border/30">
              {functionality.map((group) => (
                <div key={group.title} className="md:px-5 md:first:pl-0 md:last:pr-0">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {group.title}
                  </h3>
                  <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EF4444]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card icon={<Trophy size={18} />} title="Как формируется рейтинг" subtitle="Очки игроков по каждой дисциплине">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                Очки начисляются игрокам, занявшим места с 1 по 8 на турнирах, результаты которых собраны в календаре.
                Каждый турнир учитывается в рейтинге той дисциплины, по которой он проводился.
              </p>
              <p>
                Очки суммируются за все турниры. Кроме очков в профиле игрока отображается количество сыгранных
                турниров, побед и попаданий в топ-3.
              </p>
            </div>
            <div className="rounded-lg border border-border/30 bg-white/[0.03] divide-y divide-border/30 text-sm">
              {rankingPoints.map((row) => (
                <div key={row.place} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">{row.place}</span>
                  <span className="font-mono font-bold text-[#EF4444]">{row.points} очков</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card
          icon={<Heart size={18} />}
          title="Поддержавшие проект"
          subtitle="Игроки, которые помогли проекту материально. Спасибо!"
          badge={
            supporters.length > 0 ? (
              <span className="rounded-full border border-pink-500/30 bg-pink-500/10 px-2.5 py-0.5 text-xs font-semibold text-pink-300">
                {supporters.length}
              </span>
            ) : null
          }
        >
          {supporters.length > 0 ? (
            <ul className="divide-y divide-border/30 rounded-lg border border-border/30 bg-white/[0.03] text-sm">
              {supporters.map((s) => (
                <li key={s.name} className="flex items-center gap-3 px-4 py-2.5">
                  <Heart size={14} className="shrink-0 fill-pink-500/70 text-pink-500" />
                  <span className="font-medium text-foreground">{s.name}</span>
                  {s.note && <span className="ml-auto text-xs text-muted-foreground">{s.note}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Список скоро пополнится.</p>
          )}
        </Card>

        <Card icon={<Sparkles size={18} />} title="Особая благодарность">
          {specialThanks.length > 0 ? (
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              {specialThanks.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Текст появится позже.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
