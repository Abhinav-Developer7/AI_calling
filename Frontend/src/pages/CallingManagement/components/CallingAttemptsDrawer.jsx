import React from 'react';
import { Drawer } from '../../../components/ui/Drawer';
import { formatDateTimeIST } from '../../../utils/date';
import { StatusPill } from '../../../components/ui/StatusPill';

export function CallingAttemptsDrawer({ isOpen, process, onClose }) {
  if (!isOpen || !process) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={process.purchase?.customerName || 'Call Attempts'}
      subtitle={`Invoice #${process.purchase?.invoiceNumber || '—'}`}
      width="max-w-md"
    >
      <div className="space-y-3.5 text-xs font-sans">
        {process.attempts && process.attempts.length > 0 ? (
          process.attempts.map((att) => (
            <div
              key={att._id}
              className="p-4 bg-surface-muted rounded-[18px] border border-black/[0.04] dark:border-white/[0.06] space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-ink text-sm">
                  Attempt #{att.attemptNumber}
                </span>
                <StatusPill status={att.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-ink-soft">
                <div>
                  <span className="text-ink-soft/70">Provider:</span> <span className="font-medium text-ink">{att.provider}</span>
                </div>
                <div>
                  <span className="text-ink-soft/70">Duration:</span> <span className="font-medium text-ink tabular-nums">{att.durationSeconds || 0}s</span>
                </div>
                <div className="col-span-2 font-mono text-[10px] truncate">
                  <span className="text-ink-soft/70 font-sans">Provider ID:</span> {att.providerCallId || '—'}
                </div>
                {att.createdAt && (
                  <div className="col-span-2 text-[10px] text-ink-soft tabular-nums">
                    {formatDateTimeIST(att.createdAt)}
                  </div>
                )}
                {att.telephonyError?.message && (
                  <div className="col-span-2 text-status-danger-ink font-medium bg-status-danger-bg p-2 rounded-xl">
                    Error: {att.telephonyError.message}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-ink-soft text-xs">
            No call attempts have been initiated yet for this purchase.
          </div>
        )}
      </div>
    </Drawer>
  );
}
