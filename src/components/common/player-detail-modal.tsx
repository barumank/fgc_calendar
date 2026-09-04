'use client';

import React from 'react';
import { Trophy, Target, Medal } from 'lucide-react';
import { Player } from '@/src/types/player';
import { REGION_LABELS, GameType } from '@/src/types';
import { Modal } from '@/src/components/common/modal';

export function PlayerDetailModal({ player, gameLabels, gameColors, onClose }: {
  player: Player | null;
  gameLabels: Record<GameType, string>;
  gameColors: Record<GameType, string>;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={!!player} onClose={onClose} title={player?.tag ?? ''}>
      {player && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl" style={{ backgroundColor: gameColors[player?.mainGame] ?? '#666' }}>
              {(player?.tag ?? '?')[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold">{player?.tag}</h3>
              <div className="text-sm text-muted-foreground">{player?.realName}</div>
              <div className="text-xs text-muted-foreground">{player?.country} • {REGION_LABELS[player?.region]}</div>
            </div>
          </div>
          <span className="inline-block px-3 py-1 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: gameColors[player?.mainGame] }}>{gameLabels[player?.mainGame]}</span>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3 text-center"><Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" /><div className="text-lg font-bold">{player?.wins}</div><div className="text-xs text-muted-foreground">Побед</div></div>
            <div className="bg-white/5 rounded-lg p-3 text-center"><Medal className="w-5 h-5 mx-auto mb-1 text-orange-500" /><div className="text-lg font-bold">{player?.top3}</div><div className="text-xs text-muted-foreground">Топ-3</div></div>
            <div className="bg-white/5 rounded-lg p-3 text-center"><Target className="w-5 h-5 mx-auto mb-1 text-blue-500" /><div className="text-lg font-bold">{player?.tournamentsPlayed}</div><div className="text-xs text-muted-foreground">Турниров</div></div>
            <div className="bg-white/5 rounded-lg p-3 text-center"><div className="text-lg font-bold text-[#EF4444]">{player?.points}</div><div className="text-xs text-muted-foreground">Очков</div></div>
          </div>
          {(player?.socialLinks?.discord || player?.socialLinks?.twitter || player?.socialLinks?.twitch) && (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Соц. сети</h4>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {player?.socialLinks?.discord && <span className="bg-white/5 px-2 py-1 rounded">Discord: {player.socialLinks.discord}</span>}
                {player?.socialLinks?.twitter && <span className="bg-white/5 px-2 py-1 rounded">Twitter: {player.socialLinks.twitter}</span>}
                {player?.socialLinks?.twitch && <span className="bg-white/5 px-2 py-1 rounded">Twitch: {player.socialLinks.twitch}</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
