'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }: ModalProps) {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e?.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEsc]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${maxWidth} w-full mx-4 bg-[#1A1A2E] rounded-xl shadow-2xl border border-border/50 max-h-[90vh] overflow-y-auto animate-fade-in`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
