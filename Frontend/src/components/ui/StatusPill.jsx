import React from 'react';

export function StatusPill({ status, label, className = '' }) {
  const s = (status || label || '').toLowerCase().replace('-', '_');

  let bg = 'bg-status-neutral-bg text-status-neutral-ink';
  let dotColor = 'bg-status-neutral-ink';

  if (s.includes('positive') || s.includes('completed') || s.includes('success') || s.includes('resolved')) {
    bg = 'bg-status-success-bg text-status-success-ink';
    dotColor = 'bg-emerald-600';
  } else if (s.includes('negative') || s.includes('failed') || s.includes('danger') || s.includes('urgent') || s.includes('high') || s.includes('open')) {
    bg = 'bg-status-danger-bg text-status-danger-ink';
    dotColor = 'bg-rose-600';
  } else if (s.includes('scheduled') || s.includes('in_progress') || s.includes('calling') || s.includes('queued') || s.includes('info')) {
    bg = 'bg-status-info-bg text-status-info-ink';
    dotColor = 'bg-blue-600';
  } else if (s.includes('retry') || s.includes('no_answer') || s.includes('busy') || s.includes('medium') || s.includes('warning')) {
    bg = 'bg-status-warning-bg text-status-warning-ink';
    dotColor = 'bg-amber-600';
  }

  const displayLabel = label || status || '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-[11px] font-semibold tracking-tight whitespace-nowrap ${bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />
      <span className="capitalize">{displayLabel.replace(/_/g, ' ')}</span>
    </span>
  );
}
