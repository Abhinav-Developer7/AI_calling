import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Drawer({ isOpen, onClose, title, subtitle, children, width = 'max-w-md' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen ${width} bg-surface rounded-l-[28px] md:rounded-l-[32px] border-l border-black/[0.04] dark:border-white/[0.06] shadow-2xl flex flex-col overflow-hidden`}>
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between shrink-0">
            <div className="min-w-0 pr-4">
              <h2 className="text-base font-semibold text-ink truncate tracking-tight">{title}</h2>
              {subtitle && <p className="text-xs text-ink-soft mt-0.5 truncate">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 rounded-full bg-surface-muted hover:bg-black/5 dark:hover:bg-white/5 text-ink transition shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

