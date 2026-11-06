import React from 'react';
import { MoreVertical } from 'lucide-react';

export function StatCard({
  variant = 'light', // 'dark' | 'light'
  title,
  value,
  subvalue,
  footer,
  children,
  badge,
  className = '',
}) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`rounded-[22px] p-6 flex flex-col justify-between relative overflow-hidden transition-shadow shadow-soft hover:shadow-hover min-h-[190px] select-none ${
        isDark
          ? 'bg-frame text-white'
          : 'bg-surface text-ink border border-black/[0.04]'
      } ${className}`}
    >
      {/* Subtle background abstract shape / contour */}
      {isDark ? (
        <div
          className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/[0.03] pointer-events-none"
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-black/[0.02] pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Top Card Row */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <span
            className={`text-xs font-medium tracking-tight block ${
              isDark ? 'text-white/70' : 'text-ink-soft'
            }`}
          >
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
              {value}
            </span>
            {subvalue && (
              <span
                className={`text-xs font-normal ${
                  isDark ? 'text-white/60' : 'text-ink-soft'
                }`}
              >
                {subvalue}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {badge}
          <button
            type="button"
            aria-label="Card options"
            className={`p-1 rounded-lg transition cursor-pointer ${
              isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-ink-soft hover:text-ink hover:bg-black/[0.04]'
            }`}
          >
            <MoreVertical className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>
      </div>

      {/* Optional middle slot (e.g. star rating row or chips) */}
      {children && <div className="my-2 relative z-10">{children}</div>}

      {/* Footer / Meta Line */}
      {footer && (
        <div
          className={`pt-3 border-t text-xs flex items-center justify-between relative z-10 ${
            isDark ? 'border-white/10 text-white/70' : 'border-black/[0.06] text-ink-soft'
          }`}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

