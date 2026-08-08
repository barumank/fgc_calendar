import { useMemo } from 'react';
import useSWR from 'swr';
import { DEFAULT_GAMES, GameRecord } from '@/src/data/default-games';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useGames() {
  const { data, mutate, isLoading } = useSWR<GameRecord[]>('/next-api/games', fetcher, {
    fallbackData: DEFAULT_GAMES,
  });

  const games = useMemo(() => [...(data ?? [])].sort((a, b) => a.order - b.order), [data]);
  const gameKeys = useMemo(() => games.map((g) => g.key), [games]);
  const labels = useMemo(() => Object.fromEntries(games.map((g) => [g.key, g.label])), [games]);
  const shortLabels = useMemo(() => Object.fromEntries(games.map((g) => [g.key, g.shortLabel || g.label])), [games]);
  const colors = useMemo(() => Object.fromEntries(games.map((g) => [g.key, g.color])), [games]);

  return { games, gameKeys, labels, shortLabels, colors, mutate, isLoading };
}
