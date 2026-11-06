import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { formatDateTimeIST } from '../../utils/date';
import { maskPhoneNumber } from '../../utils/phone';
import { AudioPlayer } from '../../components/ui/AudioPlayer';
import { Drawer } from '../../components/ui/Drawer';
import { StatusPill } from '../../components/ui/StatusPill';
import { Pagination } from '../../components/ui/Pagination';
import {
  Star,
  Search,
  RefreshCw,
  Eye,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  EyeOff,
  Play,
} from 'lucide-react';

export function FeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const ratingParam = searchParams.get('rating') || 'all';
  const sentimentParam = searchParams.get('sentiment') || 'all';
  const languageParam = searchParams.get('language') || 'all';
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 5 });
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [revealedPhones, setRevealedPhones] = useState({});
  const [copiedInvoice, setCopiedInvoice] = useState(null);
  const [activeAudioId, setActiveAudioId] = useState(null);
  const [searchInput, setSearchInput] = useState(searchParam);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/feedback', {
        params: {
          rating: ratingParam === 'all' ? undefined : ratingParam,
          sentiment: sentimentParam === 'all' ? undefined : sentimentParam,
          language: languageParam === 'all' ? undefined : languageParam,
          search: searchParam || undefined,
          page: pageParam,
          limit: 5,
        },
      });
      if (res.data?.success) {
        setFeedbacks(res.data.feedbacks || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load feedback records');
    } finally {
      setLoading(false);
    }
  }, [ratingParam, sentimentParam, languageParam, searchParam, pageParam]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' || !value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter('search', searchInput.trim());
  };

  const togglePhoneReveal = (id) => {
    setRevealedPhones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyInvoice = (invoiceNumber) => {
    navigator.clipboard.writeText(invoiceNumber);
    setCopiedInvoice(invoiceNumber);
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  const renderStars = (rating) => {
    if (rating === null || rating === undefined) {
      return <span className="text-ink-soft text-xs italic">Unrated</span>;
    }
    return (
      <div className="flex items-center gap-1.5 tabular-nums">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3.5 h-3.5 ${
                star <= rating ? 'text-accent fill-accent' : 'text-black/10'
              }`}
            />
          ))}
        </div>
        <span className="font-semibold text-xs text-ink">{rating}.0</span>
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-ink tracking-tight">Feedback Records</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Verified ratings, Malayalam/English conversation transcripts, and call recordings.
          </p>
        </div>

        <button
          onClick={fetchFeedback}
          disabled={loading}
          aria-label="Refresh feedback records"
          className="flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-surface-elevated border border-black/[0.04] rounded-pill text-xs font-semibold text-ink shadow-soft hover:shadow-hover transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 stroke-[1.75] ${loading ? 'animate-spin text-accent' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-status-danger-bg border border-status-danger-ink/20 text-status-danger-ink rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 stroke-[1.75]" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar Card with URL Synced Segmented Pill Controls */}
      <div className="bg-surface p-4 rounded-[20px] border border-black/[0.04] shadow-soft space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Rating Segmented Control */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-ink-soft uppercase tracking-wider mr-1">Rating:</span>
            {['all', '5', '4', '3', '2', '1'].map((r) => (
              <button
                key={r}
                onClick={() => updateFilter('rating', r)}
                className={`px-3 py-1 rounded-pill text-xs font-semibold transition cursor-pointer ${
                  ratingParam === r
                    ? 'bg-accent text-accent-ink shadow-sm'
                    : 'bg-surface-muted text-ink-soft hover:text-ink hover:bg-black/[0.05]'
                }`}
              >
                {r === 'all' ? 'All' : `${r}★`}
              </button>
            ))}
          </div>

          {/* Sentiment Segmented Control */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-ink-soft uppercase tracking-wider mr-1">Sentiment:</span>
            {['all', 'positive', 'neutral', 'negative'].map((s) => (
              <button
                key={s}
                onClick={() => updateFilter('sentiment', s)}
                className={`px-3 py-1 rounded-pill text-xs font-semibold capitalize transition cursor-pointer ${
                  sentimentParam === s
                    ? 'bg-accent text-accent-ink shadow-sm'
                    : 'bg-surface-muted text-ink-soft hover:text-ink hover:bg-black/[0.05]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-ink-soft absolute left-3 pointer-events-none stroke-[1.75]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search customer, phone, invoice..."
              className="w-full bg-surface-muted hover:bg-black/[0.06] text-xs text-ink placeholder-ink-soft rounded-pill pl-8 pr-3 py-1.5 border border-transparent focus:border-black/10 focus:outline-none transition shadow-none"
            />
          </form>
        </div>
      </div>

      {/* Main Table: Sticky Header, Sticky First Column, Horizontal Overflow Container */}
      <div className="bg-surface rounded-[20px] border border-black/[0.04] shadow-soft overflow-hidden">
        <div className="overflow-x-auto relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-elevated text-[11px] uppercase font-semibold text-ink-soft border-b border-black/[0.04] sticky top-0 z-20">
              <tr>
                <th className="px-5 py-3.5 sticky left-0 bg-surface-elevated z-30 min-w-[210px] border-r border-black/[0.04]">
                  Customer & Invoice
                </th>
                <th className="px-4 py-3.5 min-w-[130px]">Rating</th>
                <th className="px-4 py-3.5 min-w-[120px]">Sentiment</th>
                <th className="px-4 py-3.5 min-w-[110px]">Language</th>
                <th className="px-4 py-3.5 min-w-[260px] max-w-xs">Summary</th>
                <th className="px-4 py-3.5 min-w-[180px]">Call Audio</th>
                <th className="px-4 py-3.5 min-w-[140px]">Date (IST)</th>
                <th className="px-4 py-3.5 text-right min-w-[100px] sticky right-0 bg-surface-elevated z-20 border-l border-black/[0.04]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {loading && feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-14 text-center text-ink-soft">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Loading feedback records...</p>
                  </td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-14 text-center text-ink-soft">
                    <p className="text-xs font-semibold text-ink">No feedback records found</p>
                    <p className="text-[11px] mt-0.5">Try adjusting filters or searching for another invoice.</p>
                  </td>
                </tr>
              ) : (
                feedbacks.map((fb) => {
                  const invoice = fb.purchase?.invoiceNumber || '—';
                  const rawPhone = fb.purchase?.phoneNumber || '';
                  const isPhoneRevealed = Boolean(revealedPhones[fb._id]);
                  const displayedPhone = isPhoneRevealed ? rawPhone : maskPhoneNumber(rawPhone);
                  const isAudioActive = activeAudioId === fb._id;

                  return (
                    <tr
                      key={fb._id}
                      className="hover:bg-surface-elevated/70 transition group"
                    >
                      {/* Sticky First Column: Customer & Invoice */}
                      <td className="px-5 py-3.5 sticky left-0 bg-surface group-hover:bg-surface-elevated z-10 border-r border-black/[0.04]">
                        <p className="font-semibold text-ink text-xs truncate max-w-[180px]">
                          {fb.purchase?.customerName || 'Customer'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
                            {displayedPhone}
                          </span>
                          {rawPhone && (
                            <button
                              type="button"
                              onClick={() => togglePhoneReveal(fb._id)}
                              title={isPhoneRevealed ? 'Mask phone number' : 'Reveal phone number (Audit logged)'}
                              aria-label={isPhoneRevealed ? 'Mask phone number' : 'Reveal phone number'}
                              className="text-ink-soft hover:text-ink p-0.5"
                            >
                              {isPhoneRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-[10px] text-ink-soft bg-surface-muted px-1.5 py-0.2 rounded whitespace-nowrap">
                            {invoice}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyInvoice(invoice)}
                            title="Copy invoice number"
                            aria-label="Copy invoice number"
                            className="text-ink-soft hover:text-ink p-0.5"
                          >
                            {copiedInvoice === invoice ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {renderStars(fb.overallRating)}
                      </td>

                      {/* Sentiment Pastel Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusPill status={fb.sentiment} label={fb.sentiment} />
                      </td>

                      {/* Language */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-medium text-ink-secondary">
                        <span className="capitalize">{fb.languageUsed || 'Malayalam'}</span>
                      </td>

                      {/* Summary with 2-line clamp & Flagged status indicator */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <p
                          className="line-clamp-2 text-ink-secondary text-[11px] leading-relaxed cursor-pointer hover:text-ink"
                          title={fb.summary || fb.feedbackText}
                          onClick={() => setSelectedFeedback(fb)}
                        >
                          "{fb.summary || fb.feedbackText || 'No summary available.'}"
                        </p>
                        {fb.complaintDetected && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold bg-status-danger-bg text-status-danger-ink">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>Flagged</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Audio Player */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {fb.recordingUrl ? (
                          isAudioActive ? (
                            <AudioPlayer src={fb.recordingUrl} />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveAudioId(fb._id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-surface-muted hover:bg-accent text-ink hover:text-accent-ink text-[11px] font-semibold transition cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current stroke-[2] translate-x-0.5" />
                              <span>Play Audio</span>
                            </button>
                          )
                        ) : (
                          <span className="text-ink-soft text-[11px]">No recording</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-ink-soft font-mono text-[11px] tabular-nums">
                        {formatDateTimeIST(fb.collectedAt || fb.createdAt)}
                      </td>

                      {/* Sticky Action Column */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap sticky right-0 bg-surface group-hover:bg-surface-elevated z-10 border-l border-black/[0.04]">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedFeedback(fb)}
                            title="View conversation details"
                            aria-label="View conversation details"
                            className="p-1.5 text-ink-soft hover:text-ink hover:bg-surface-muted rounded-lg transition"
                          >
                            <Eye className="w-4 h-4 stroke-[1.75]" />
                          </button>
                          {fb.complaintDetected && (
                            <button
                              type="button"
                              onClick={() => navigate(`/complaints?search=${encodeURIComponent(invoice)}`)}
                              title="Open complaint ticket"
                              aria-label="Open complaint ticket"
                              className="p-1.5 text-rose-600 hover:bg-status-danger-bg rounded-lg transition"
                            >
                              <ExternalLink className="w-4 h-4 stroke-[1.75]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      <Pagination
        page={pageParam}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || 0}
        limit={5}
        onPageChange={handlePageChange}
        loading={loading}
      />

      {/* Row Detail Drawer (Slide-Over Detail View) */}
      <Drawer
        isOpen={Boolean(selectedFeedback)}
        onClose={() => setSelectedFeedback(null)}
        title={selectedFeedback?.purchase?.customerName || 'Customer Feedback'}
        subtitle={`Invoice #${selectedFeedback?.purchase?.invoiceNumber || '—'} · Collected ${formatDateTimeIST(
          selectedFeedback?.collectedAt || selectedFeedback?.createdAt
        )}`}
        width="max-w-md"
      >
        {selectedFeedback && (
          <div className="space-y-4 text-xs font-sans">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-surface-muted rounded-2xl">
              <div>
                <span className="text-ink-soft text-[10px] uppercase font-semibold block">Rating</span>
                <div className="mt-1">{renderStars(selectedFeedback.overallRating)}</div>
              </div>
              <div>
                <span className="text-ink-soft text-[10px] uppercase font-semibold block">Sentiment</span>
                <div className="mt-1">
                  <StatusPill status={selectedFeedback.sentiment} label={selectedFeedback.sentiment} />
                </div>
              </div>
              <div>
                <span className="text-ink-soft text-[10px] uppercase font-semibold block">Language</span>
                <span className="capitalize font-semibold text-ink mt-1 block">
                  {selectedFeedback.languageUsed || 'Malayalam'}
                </span>
              </div>
            </div>

            {/* Audio Recording */}
            {selectedFeedback.recordingUrl && (
              <div>
                <h3 className="font-semibold text-ink text-xs mb-1.5">
                  Call Recording
                </h3>
                <AudioPlayer src={selectedFeedback.recordingUrl} className="w-full" />
              </div>
            )}

            {/* AI Summary */}
            <div>
              <h3 className="font-semibold text-ink text-xs mb-1">
                AI Conversation Summary
              </h3>
              <p className="p-3 bg-surface-muted rounded-2xl text-ink-secondary leading-relaxed">
                {selectedFeedback.summary || 'No summary available.'}
              </p>
            </div>

            {/* Customer Comments */}
            {selectedFeedback.feedbackText && (
              <div>
                <h3 className="font-semibold text-ink text-xs mb-1">
                  Customer Comments
                </h3>
                <p className="p-3 bg-surface-muted rounded-2xl text-ink-secondary italic">
                  "{selectedFeedback.feedbackText}"
                </p>
              </div>
            )}

            {/* Customer Suggestion */}
            {selectedFeedback.suggestion && (
              <div>
                <h3 className="font-semibold text-accent-ink text-xs mb-1">
                  Customer Suggestion
                </h3>
                <p className="p-3 bg-accent/20 rounded-2xl text-ink">
                  {selectedFeedback.suggestion}
                </p>
              </div>
            )}

            {/* Full Malayalam / English Transcript */}
            {selectedFeedback.transcript && (
              <div>
                <h3 className="font-semibold text-ink text-xs mb-1">
                  Full Conversation Transcript
                </h3>
                <div className="p-3 bg-surface-muted rounded-2xl text-ink-secondary whitespace-pre-wrap font-malayalam text-xs max-h-56 overflow-y-auto leading-relaxed">
                  {selectedFeedback.transcript}
                </div>
              </div>
            )}

            {/* Flagged Complaint Status */}
            {selectedFeedback.complaintDetected && (
              <div className="p-3 bg-status-danger-bg text-status-danger-ink rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Escalation Flagged</span>
                </div>
                <p className="text-[11px] text-ink-secondary">
                  {selectedFeedback.complaintSummary || 'A complaint ticket has been generated for staff follow-up.'}
                </p>
              </div>
            )}

            {/* Drawer Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-black/[0.04]">
              <button
                type="button"
                onClick={() => handleCopyInvoice(selectedFeedback.purchase?.invoiceNumber)}
                className="px-3.5 py-1.5 rounded-pill bg-surface-muted hover:bg-black/[0.06] text-xs font-medium text-ink flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Invoice</span>
              </button>

              {selectedFeedback.complaintDetected && (
                <button
                  type="button"
                  onClick={() => navigate(`/complaints?search=${encodeURIComponent(selectedFeedback.purchase?.invoiceNumber)}`)}
                  className="px-3.5 py-1.5 rounded-pill bg-rose-600 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-rose-500 transition"
                >
                  <span>Open Complaint</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
