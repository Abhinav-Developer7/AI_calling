import React from 'react';

export function PillButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default', // 'primary' | 'default'
  className = '',
  type = 'button',
}) {
  const isPrimary = variant === 'primary';

  return (
    <button
      type={type}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-pill text-xs font-semibold tracking-tight transition-all duration-150 cursor-pointer shadow-soft hover:shadow-hover select-none ${
        isPrimary
          ? 'bg-accent text-accent-ink hover:bg-accent-hover'
          : 'bg-surface text-ink hover:bg-surface-elevated border border-black/[0.04]'
      } ${className}`}
    >
      {Icon && (
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            isPrimary ? 'bg-black/10 text-accent-ink' : 'bg-frame text-white'
          }`}
        >
          <Icon className="w-3.5 h-3.5 stroke-[2]" />
        </span>
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

