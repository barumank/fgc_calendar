'use client';

import React, { useState } from 'react';
import { RotateCcw, RotateCw, FlipHorizontal, Sun, Contrast } from 'lucide-react';
import { Modal } from './modal';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onConfirm: (dataUrl: string) => void;
}

export function ImageEditorModal({ isOpen, onClose, imageUrl, onConfirm }: ImageEditorModalProps) {
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  const handleConfirm = () => {
    onConfirm(imageUrl);
    setRotation(0);
    setFlipH(false);
    setBrightness(100);
    setContrast(100);
  };

  const handleCancel = () => {
    setRotation(0);
    setFlipH(false);
    setBrightness(100);
    setContrast(100);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Редактор изображения" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="bg-black/30 rounded-lg p-4 flex items-center justify-center min-h-[250px]">
          <img
            src={imageUrl}
            alt="Редактирование"
            className="max-h-[250px] max-w-full rounded"
            style={{
              transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
              filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              transition: 'transform 0.3s, filter 0.2s',
            }}
          />
        </div>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setRotation((r: number) => r - 90)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors" title="Поворот влево">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => setRotation((r: number) => r + 90)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors" title="Поворот вправо">
            <RotateCw className="w-5 h-5" />
          </button>
          <button onClick={() => setFlipH((f: boolean) => !f)} className={`p-2 rounded-lg transition-colors ${flipH ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-white/5 hover:bg-white/10'}`} title="Отразить">
            <FlipHorizontal className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Sun className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground w-20">Яркость</span>
            <input type="range" min="50" max="150" value={brightness} onChange={(e: any) => setBrightness(Number(e?.target?.value ?? 100))} className="flex-1" />
            <span className="text-xs font-mono w-10 text-right">{brightness}%</span>
          </div>
          <div className="flex items-center gap-3">
            <Contrast className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground w-20">Контраст</span>
            <input type="range" min="50" max="150" value={contrast} onChange={(e: any) => setContrast(Number(e?.target?.value ?? 100))} className="flex-1" />
            <span className="text-xs font-mono w-10 text-right">{contrast}%</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleConfirm} className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">Подтвердить</button>
          <button onClick={handleCancel} className="flex-1 bg-white/5 hover:bg-white/10 py-2.5 rounded-lg text-sm font-medium transition-colors">Отмена</button>
        </div>
      </div>
    </Modal>
  );
}
