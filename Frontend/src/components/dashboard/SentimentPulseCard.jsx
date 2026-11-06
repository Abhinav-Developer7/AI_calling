import React, { useState } from 'react';
import { Info, AlertTriangle, CheckCircle2, ChevronRight, PhoneCall } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

export function SentimentPulseCard({ sentimentData = [], totalCount = 0, activeComplaints = [] }) {
  const [period, setPeriod] = useState('7d');

  // Colors aligned with the design system
  const PALETTE = {
    POSITIVE: '#10b981', // Emerald
    NEUTRAL: '#9ca3af',  // Soft grey
    NEGATIVE: '#f87171', // Rose
  };

  const formattedData = sentimentData.map((d) => ({
    name: d.name,
    value: d.value,
    color: PALETTE[d.name] || d.color || '#9ca3af',
  }));

  const positiveItem = formattedData.find((d) => d.name === 'POSITIVE');
  const positiveVal = positiveItem ? positiveItem.value : 0;
  const positivePct = totalCount > 0 ? Math.round((positiveVal / totalCount) * 100) : 0;

  return (
    <div className="bg-surface rounded-[24px] p-6 shadow-soft border border-black/[0.04] flex flex-col justify-between select-none">
      <div>
        {/* Header: Title + Period Select Pill */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.04]">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-ink tracking-tight">Sentiment Pulse</h2>
            <div className="relative group cursor-pointer text-ink-soft hover:text-ink">
              <Info className="w-3.5 h-3.5 stroke-[2]" />
              <div
                role="tooltip"
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-frame text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30"
              >
                Computed from live telephone call transcripts
              </div>
            </div>
          </div>

          {/* Period Dropdown Pill */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-xs bg-surface-muted hover:bg-black/[0.06] text-ink font-medium rounded-pill px-3 py-1 border-none focus:outline-none cursor-pointer transition shadow-none"
          >
            <option value="today">Today</option>
            <option value="7d">This week</option>
            <option value="30d">This month</option>
          </select>
        </div>

        {/* Thick Donut Chart Container */}
        <div className="my-5 relative flex items-center justify-center">
          <div className="w-48 h-48 relative flex items-center justify-center shrink-0">
            {formattedData.length > 0 && totalCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={74}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {formattedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-36 h-36 rounded-full border-8 border-surface-muted flex items-center justify-center" />
            )}

            {/* Total Count in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xs text-ink-soft uppercase tracking-wider font-medium">Total</span>
              <span className="text-2xl font-bold text-ink tabular-nums mt-0.5">
                {totalCount}
              </span>
            </div>

            {/* Floating Highlight Value Pill on top-right of Donut */}
            {totalCount > 0 && (
              <div className="absolute top-2 right-1 px-2.5 py-0.5 rounded-pill bg-frame text-white text-[11px] font-bold shadow-md tabular-nums">
                {positivePct}% Favorable
              </div>
            )}
          </div>
        </div>

        {/* 2/3-Item Pastel Legend */}
        <div className="flex items-center justify-center gap-5 text-xs pb-5 border-b border-black/[0.04]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-ink-soft font-medium">Positive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-ink-soft font-medium">Neutral</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-ink-soft font-medium">Negative</span>
          </div>
        </div>

        {/* Priority Escalations / Flagged Feed */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink uppercase tracking-wider">
              Priority Escalations
            </span>
            <span className="text-[11px] text-ink-soft tabular-nums">
              {activeComplaints.length} pending
            </span>
          </div>

          <div className="space-y-2.5">
            {activeComplaints.length > 0 ? (
              activeComplaints.slice(0, 3).map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-surface-elevated hover:bg-black/[0.03] transition duration-150 border border-black/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">{item.customerName}</p>
                      <p className="text-[11px] text-ink-soft truncate">
                        {item.description || 'Customer reported an issue during feedback call.'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-rose-600 px-2.5 py-0.5 rounded-pill bg-status-danger-bg shrink-0 ml-2">
                    {item.priority || 'Review'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-ink-soft space-y-1 bg-surface-elevated rounded-2xl border border-black/[0.02]">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1 stroke-[2]" />
                <p className="font-semibold text-ink">Zero pending escalations</p>
                <p className="text-[11px]">All customer concerns resolved</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Link to Complaints */}
      <div className="pt-4 mt-4 border-t border-black/[0.04] flex items-center justify-between text-xs">
        <span className="text-ink-soft">Review queue</span>
        <Link
          to="/complaints"
          className="text-ink font-semibold hover:text-accent-hover inline-flex items-center gap-1 transition"
        >
          <span>Open all tickets</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
        </Link>
      </div>
    </div>
  );
}

