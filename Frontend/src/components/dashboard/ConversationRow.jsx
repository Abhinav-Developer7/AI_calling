import React, { useState } from 'react';
import { Star, Play, Pause, Volume2 } from 'lucide-react';
import { StatusPill } from '../ui/StatusPill';
import { AudioPlayer } from '../ui/AudioPlayer';
import { formatDateTimeIST } from '../../utils/date';

export function ConversationRow({ call, onSelect }) {
  const [isPlayingInline, setIsPlayingInline] = useState(false);

  const customerName = call.customerName || 'Customer';
  const initials = customerName.substring(0, 2).toUpperCase();
  const invoice = call.invoiceNumber || '—';
  const dateStr = formatDateTimeIST(call.callCompletedAt || call.createdAt);
  const rating = call.overallRating ? Number(call.overallRating).toFixed(1) : null;

  return (
    <div
      onClick={onSelect}
      className="bg-surface rounded-2xl p-4 shadow-soft hover:shadow-hover border border-black/[0.04] transition duration-150 flex items-center justify-between gap-4 cursor-pointer select-none group"
    >
      {/* Left: Avatar with Presence Dot + Customer Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-surface-muted group-hover:bg-accent/20 border border-black/[0.04] flex items-center justify-center font-bold text-xs text-ink transition-colors">
            {initials}
          </div>
          <span
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-xs text-ink truncate group-hover:text-ink-secondary">
              {customerName}
            </h3>
            <span className="text-[10px] text-ink-soft font-mono bg-surface-muted px-1.5 py-0.2 rounded">
              #{invoice}
            </span>
          </div>
          <p className="text-[11px] text-ink-soft truncate mt-0.5">
            {call.summary || call.feedbackText || 'Post-purchase customer feedback collected.'}
          </p>
        </div>
      </div>

      {/* Date */}
      <div className="hidden sm:block text-xs text-ink-soft font-mono whitespace-nowrap tabular-nums">
        {dateStr}
      </div>

      {/* Sentiment Pastel Badge */}
      <div className="shrink-0">
        <StatusPill
          status={call.sentiment || 'neutral'}
          label={call.sentiment || 'Neutral'}
        />
      </div>

      {/* Right: Rating & Inline Audio Trigger */}
      <div className="flex items-center gap-3 shrink-0 text-right">
        {rating ? (
          <div className="flex items-center gap-1 font-bold text-xs text-ink tabular-nums">
            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
            <span>{rating}</span>
          </div>
        ) : (
          <span className="text-xs text-ink-soft italic">Unrated</span>
        )}

        {call.recordingUrl && (
          <div onClick={(e) => e.stopPropagation()}>
            {isPlayingInline ? (
              <AudioPlayer src={call.recordingUrl} />
            ) : (
              <button
                type="button"
                onClick={() => setIsPlayingInline(true)}
                title="Play recording"
                aria-label="Play recording"
                className="w-7 h-7 rounded-full bg-surface-muted hover:bg-accent text-ink hover:text-accent-ink flex items-center justify-center transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current stroke-[2] translate-x-0.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

