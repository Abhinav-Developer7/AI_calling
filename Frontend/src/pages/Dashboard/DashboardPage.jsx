import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { StatCard } from '../../components/ui/StatCard';
import { PillButton } from '../../components/ui/PillButton';
import { ConversationRow } from '../../components/dashboard/ConversationRow';
import { SentimentPulseCard } from '../../components/dashboard/SentimentPulseCard';
import { Drawer } from '../../components/ui/Drawer';
import { AudioPlayer } from '../../components/ui/AudioPlayer';
import { StatusPill } from '../../components/ui/StatusPill';
import { formatDateTimeIST } from '../../utils/date';
import {
  PhoneCall,
  Clock,
  Star,
  RefreshCw,
  Plus,
  AlertCircle,
  BarChart3,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export function DashboardPage() {
  const { setIsPurchaseModalOpen } = useOutletContext() || {};
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    callsScheduled: 0,
    callsCompleted: 0,
    callsFailedOrNoAnswer: 0,
    avgRating: 0,
    openComplaints: 0,
    feedbackCollectionRate: 0,
    favorablePercentage: 0,
    callingWindow: { start: '10:00', end: '20:00', timezone: 'Asia/Kolkata' },
  });
  const [sentimentData, setSentimentData] = useState([]);
  const [recentActivity, setRecentActivity] = useState({
    recentPurchases: [],
    recentCompletedCalls: [],
    activeComplaints: [],
  });
  const [selectedCall, setSelectedCall] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, statsRes, activityRes] = await Promise.all([
        apiClient.get('/dashboard/overview'),
        apiClient.get('/dashboard/call-statistics'),
        apiClient.get('/dashboard/recent-activity'),
      ]);

      if (overviewRes.data?.success) {
        setStats(overviewRes.data.stats);
      }
      if (statsRes.data?.success) {
        setSentimentData(statsRes.data.sentimentDistribution || []);
      }
      if (activityRes.data?.success) {
        setRecentActivity({
          recentPurchases: activityRes.data.recentPurchases || [],
          recentCompletedCalls: activityRes.data.recentCompletedCalls || [],
          activeComplaints: activityRes.data.activeComplaints || [],
        });
      }
    } catch (err) {
      // Safe fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalSentimentCount = sentimentData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 font-sans">
      {/* =========================================================================
          ROW 1 & 2 (Main Layout): 2-Column Responsive Split
          Left Column (Cards + Actions + Recent Conversations)
          Right Column (Sentiment Pulse + Escalations Card)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 spans on desktop) */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Section: Performance Cards Header */}
          <div>
            <div className="flex items-center justify-between h-5 mb-3 px-1">
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider leading-none">
                Performance Overview
              </h2>
              <Link
                to="/reports"
                className="text-xs text-ink-soft hover:text-ink font-medium transition leading-none"
              >
                See all
              </Link>
            </div>

            {/* Cards Row: Two Equal Summary Cards (One Dark, One Light) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Dark Variant (Feedback Collection Rate) */}
              <StatCard
                variant="dark"
                title="Feedback Collection Rate"
                value={`${stats.feedbackCollectionRate ?? 0}%`}
                subvalue="conversion"
                badge={
                  <span className="px-2.5 py-0.5 rounded-pill bg-white/10 text-accent font-semibold text-[10px] tracking-tight">
                    Post-Purchase
                  </span>
                }
                footer={
                  <>
                    <span>{stats.callsCompleted} of {stats.totalPurchases} customers called</span>
                    <span className="text-accent font-medium">15m post-billing</span>
                  </>
                }
              >
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, stats.feedbackCollectionRate ?? 0))}%` }}
                  />
                </div>
              </StatCard>

              {/* Card 2: Light Variant (Customer Experience Rating) */}
              <StatCard
                variant="light"
                title="Customer Experience"
                value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
                subvalue="/ 5.0 Rating"
                badge={
                  <span className="px-2.5 py-0.5 rounded-pill bg-status-success-bg text-status-success-ink font-semibold text-[10px]">
                    Verified Calls
                  </span>
                }
                footer={
                  <>
                    <span>Across {stats.callsCompleted} customer calls</span>
                    <span className="text-ink font-semibold">1–5 Scale</span>
                  </>
                }
              >
                {/* 5-Star Row Aligned with Reference */}
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(stats.avgRating || 0)
                        ? 'text-accent fill-accent'
                        : 'text-black/10'
                        }`}
                    />
                  ))}
                  <span className="text-xs text-ink-soft ml-1.5 font-medium tabular-nums">
                    {stats.favorablePercentage ?? 0}% Favorable
                  </span>
                </div>
              </StatCard>
            </div>
          </div>

          {/* Quick-Action Pill Row (4 Equal Pill Buttons) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Pill 1: Primary Action (Warm Champagne Gold Fill) */}
            <PillButton
              variant="primary"
              icon={Plus}
              label="New Call"
              onClick={() => setIsPurchaseModalOpen?.(true)}
            />

            {/* Pill 2: Calling Queue */}
            <PillButton
              variant="default"
              icon={PhoneCall}
              label="Calling Queue"
              onClick={() => navigate('/calling')}
            />

            {/* Pill 3: Complaints */}
            <PillButton
              variant="default"
              icon={AlertCircle}
              label="Complaints"
              onClick={() => navigate('/complaints')}
            />

            {/* Pill 4: Reports */}
            <PillButton
              variant="default"
              icon={BarChart3}
              label="Reports"
              onClick={() => navigate('/reports')}
            />
          </div>

          {/* Section: Recent Conversations (Floating Rounded Row Surfaces) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Recent Conversations
                </h2>
                <p className="text-[11px] text-ink-soft mt-0.5">
                  Latest customer calls collected automatically by Anjali
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  aria-label="Refresh conversations"
                  className="p-1.5 rounded-full text-ink-soft hover:text-ink hover:bg-surface transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
                </button>
                <Link
                  to="/feedback"
                  className="text-xs text-ink-soft hover:text-ink font-medium transition"
                >
                  See all
                </Link>
              </div>
            </div>

            {/* Column Labels Row (Small Grey Text Matching Reference) */}
            <div className="flex items-center justify-between px-5 text-[11px] font-medium text-ink-soft uppercase tracking-wider select-none">
              <span className="flex-1">Customer</span>
              <span className="hidden sm:block w-32">Date</span>
              <span className="w-24 text-center">Sentiment</span>
              <span className="w-28 text-right">Rating</span>
            </div>

            {/* Floating Rows Stack */}
            <div className="space-y-2.5">
              {recentActivity.recentCompletedCalls && recentActivity.recentCompletedCalls.length > 0 ? (
                recentActivity.recentCompletedCalls.map((call) => (
                  <ConversationRow
                    key={call._id}
                    call={call}
                    onSelect={() => setSelectedCall(call)}
                  />
                ))
              ) : (
                <div className="bg-surface rounded-2xl p-8 text-center text-xs text-ink-soft shadow-soft border border-black/[0.04] space-y-1">
                  <p className="font-semibold text-ink">No feedback conversations yet</p>
                  <p className="text-[11px]">
                    Completed post-purchase calls will appear here automatically with ratings and audio.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sentiment Pulse Card (Donut + Legend + Escalation Feed) */}
        <div className="lg:col-span-1 min-w-0">
          <div className="hidden lg:block h-5 mb-3" aria-hidden="true" />
          <SentimentPulseCard
            sentimentData={sentimentData}
            totalCount={totalSentimentCount}
            activeComplaints={recentActivity.activeComplaints || []}
          />
        </div>
      </div>

      {/* Row Detail Drawer (Slide-Over Detail View) */}
      <Drawer
        isOpen={Boolean(selectedCall)}
        onClose={() => setSelectedCall(null)}
        title={selectedCall?.customerName || 'Customer Feedback'}
        subtitle={`Invoice #${selectedCall?.invoiceNumber || '—'} · ${formatDateTimeIST(
          selectedCall?.callCompletedAt || selectedCall?.createdAt
        )}`}
        width="max-w-md"
      >
        {selectedCall && (
          <div className="space-y-4 text-xs font-sans">
            {/* Quick Strip */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-surface-muted rounded-2xl">
              <div>
                <span className="text-ink-soft text-[10px] uppercase font-semibold block">Rating</span>
                <span className="font-bold text-ink text-sm mt-0.5 block tabular-nums">
                  {selectedCall.overallRating ? `${selectedCall.overallRating}.0 ★` : '—'}
                </span>
              </div>
              <div>
                <span className="text-ink-soft text-[10px] uppercase font-semibold block">Sentiment</span>
                <div className="mt-1">
                  <StatusPill status={selectedCall.sentiment} label={selectedCall.sentiment} />
                </div>
              </div>
              <div>
                <span className="text-ink-soft text-[10px] uppercase font-semibold block">Language</span>
                <span className="capitalize font-semibold text-ink text-xs mt-1 block">
                  {selectedCall.languageUsed || 'Malayalam'}
                </span>
              </div>
            </div>

            {/* Audio Recording */}
            {selectedCall.recordingUrl && (
              <div>
                <h3 className="font-semibold text-ink text-xs mb-1.5">
                  Call Recording
                </h3>
                <AudioPlayer src={selectedCall.recordingUrl} className="w-full" />
              </div>
            )}

            {/* AI Summary */}
            <div>
              <h3 className="font-semibold text-ink text-xs mb-1">
                AI Conversation Summary
              </h3>
              <p className="p-3.5 bg-surface-muted rounded-2xl text-ink-secondary leading-relaxed">
                {selectedCall.summary || selectedCall.feedbackText || 'No summary available.'}
              </p>
            </div>

            {/* Transcript if available */}
            {selectedCall.transcript && (
              <div>
                <h3 className="font-semibold text-ink text-xs mb-1">
                  Conversation Transcript
                </h3>
                <div className="p-3.5 bg-surface-muted rounded-2xl text-ink-secondary whitespace-pre-wrap font-malayalam text-xs max-h-48 overflow-y-auto leading-relaxed">
                  {selectedCall.transcript}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
