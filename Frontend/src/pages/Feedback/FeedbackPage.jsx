import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  Star,
  MessageSquare,
  Search,
  RefreshCw,
  Eye,
  AlertTriangle,
  Languages,
  Calendar,
} from 'lucide-react';

export function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const fetchFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/feedback', {
        params: {
          rating: ratingFilter === 'all' ? undefined : ratingFilter,
          sentiment: sentimentFilter === 'all' ? undefined : sentimentFilter,
        },
      });
      if (res.data.success) {
        setFeedbacks(res.data.feedbacks || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [ratingFilter, sentimentFilter]);

  const renderStars = (rating) => {
    if (rating === null || rating === undefined) {
      return <span className="text-slate-400 text-xs italic">Not Provided</span>;
    }
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
            }`}
          />
        ))}
        <span className="ml-1 font-bold text-xs text-slate-800">{rating}/5</span>
      </div>
    );
  };

  const getSentimentBadge = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
            Positive
          </span>
        );
      case 'negative':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 uppercase tracking-wider">
            Negative
          </span>
        );
      case 'neutral':
      default:
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase tracking-wider">
            Neutral
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Feedback & Ratings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Structured ratings (1–5 scale), sentiments, and AI-extracted summaries
          </p>
        </div>

        <button
          onClick={fetchFeedback}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Feedback
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Rating:</span>
          {['all', '5', '4', '3', '2', '1'].map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                ratingFilter === r
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r === 'all' ? 'All' : `${r} ★`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Sentiment:</span>
          {['all', 'positive', 'neutral', 'negative'].map((s) => (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                sentimentFilter === s
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Customer & Invoice</th>
                <th className="px-6 py-4">Overall Rating</th>
                <th className="px-6 py-4">Sentiment</th>
                <th className="px-6 py-4">Language</th>
                <th className="px-6 py-4">AI Conversation Summary</th>
                <th className="px-6 py-4">Collected At</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading feedback records...
                  </td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <Star className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No feedback records collected yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Completed AI feedback calls will automatically populate this table.
                    </p>
                  </td>
                </tr>
              ) : (
                feedbacks.map((fb) => (
                  <tr key={fb._id} className="hover:bg-slate-50/80 transition text-xs">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{fb.purchase?.customerName || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{fb.purchase?.phoneNumber}</p>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono mt-0.5 inline-block">
                        {fb.purchase?.invoiceNumber}
                      </span>
                    </td>

                    <td className="px-6 py-4">{renderStars(fb.overallRating)}</td>

                    <td className="px-6 py-4">{getSentimentBadge(fb.sentiment)}</td>

                    <td className="px-6 py-4">
                      <span className="capitalize text-slate-700 font-medium">
                        {fb.languageUsed || 'Malayalam'}
                      </span>
                    </td>

                    <td className="px-6 py-4 max-w-sm">
                      <p className="truncate text-slate-800" title={fb.summary}>
                        {fb.summary || fb.feedbackText || 'N/A'}
                      </p>
                      {fb.complaintDetected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> Flagged for Complaint Review
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(fb.collectedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedFeedback(fb)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="View Full Conversation Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Customer Feedback Details</h3>
                <p className="text-xs text-slate-500">
                  {selectedFeedback.purchase?.customerName} — {selectedFeedback.purchase?.invoiceNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Overall Rating</span>
                  <div className="mt-1">{renderStars(selectedFeedback.overallRating)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Sentiment</span>
                  <div className="mt-1">{getSentimentBadge(selectedFeedback.sentiment)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Language</span>
                  <span className="capitalize font-medium text-slate-800">{selectedFeedback.languageUsed}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 mb-1">AI Conversation Summary</h4>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-800 leading-relaxed">
                  {selectedFeedback.summary || 'No conversation summary available.'}
                </p>
              </div>

              {selectedFeedback.feedbackText && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-1">Customer Comments</h4>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-800 italic">
                    "{selectedFeedback.feedbackText}"
                  </p>
                </div>
              )}

              {selectedFeedback.suggestion && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-1">Customer Suggestion</h4>
                  <p className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-amber-900">
                    {selectedFeedback.suggestion}
                  </p>
                </div>
              )}

              {selectedFeedback.recordingUrl && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-1">Call Audio Recording</h4>
                  <audio controls className="w-full mt-1 rounded-lg" src={selectedFeedback.recordingUrl}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {selectedFeedback.transcript && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-1">Full Conversation Transcript</h4>
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-800 whitespace-pre-wrap font-sans text-[11px] max-h-48 overflow-y-auto border border-slate-200">
                    {selectedFeedback.transcript}
                  </div>
                </div>
              )}

              {selectedFeedback.complaintDetected && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Customer Issue Detected</span>
                  </div>
                  <p className="text-[11px]">
                    {selectedFeedback.complaintSummary || 'A complaint has been registered in the Complaints section for staff follow-up.'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
