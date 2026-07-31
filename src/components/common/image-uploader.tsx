'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { ImageEditorModal } from './image-editor-modal';

interface ImageUploaderProps {
  onImageConfirm: (dataUrl: string) => void;
  currentImage?: string;
  aspectRatio?: string;
  label?: string;
}

export function ImageUploader({ onImageConfirm, currentImage, label = 'Загрузить изображение' }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      setRawImage(e?.target?.result ?? null);
      setEditorOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e?.dataTransfer?.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const handleConfirm = useCallback((dataUrl: string) => {
    setPreview(dataUrl);
    onImageConfirm(dataUrl);
    setEditorOpen(false);
  }, [onImageConfirm]);

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e: React.DragEvent) => e.preventDefault()}
        onClick={() => inputRef?.current?.click?.()}
        className="relative border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer hover:border-[#EF4444]/50 transition-colors"
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Превью" className="max-h-40 mx-auto rounded-lg" />
            <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); setPreview(null); }} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">Перетащите или нажмите</div>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e: any) => handleFile(e?.target?.files?.[0])} />
      </div>
      {rawImage && (
        <ImageEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          imageUrl={rawImage}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
