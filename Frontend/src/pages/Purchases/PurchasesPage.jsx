import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { AddPurchaseModal } from '../../components/purchases/AddPurchaseModal';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  PhoneCall,
  AlertCircle,
  Eye,
} from 'lucide-react';

export function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const fetchPurchases = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/purchases', {
        params: { search: search.trim() },
      });
      if (res.data.success) {
        setPurchases(res.data.purchases || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPurchases();
  };

  const getStatusBadge = (process) => {
    if (!process) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
          Pending
        </span>
      );
    }

    switch (process.callStatus) {
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case 'calling':
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <PhoneCall className="w-3 h-3 text-blue-600" />
            In Progress
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3 h-3 text-slate-400" />
            Skipped
          </span>
        );
      case 'failed':
      case 'no_answer':
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3 text-red-600" />
            {process.callStatus.replace('_', ' ')}
          </span>
        );
      case 'opted_out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Opted Out
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 capitalize">
            {process.callStatus}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchases & Ingestion</h1>
          <p className="text-sm text-slate-500 mt-1">Invoices ingested from billing software and manual test bills</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-sm shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Manual Bill</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer name, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchPurchases}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Purchases Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items Summary</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Consent</th>
                <th className="px-6 py-4">Calling Status</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && purchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading purchases...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No purchase records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click <strong className="text-amber-600 font-semibold">"Add Manual Bill"</strong> above to create a test purchase.
                    </p>
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 text-xs">
                      {p.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800 text-xs">{p.customerName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700 max-w-xs truncate" title={p.itemsSummary}>
                      {p.itemsSummary}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-900">
                      ₹{Number(p.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {p.branchId || 'Main'}
                    </td>
                    <td className="px-6 py-4">
                      {p.feedbackCallConsent ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                          Granted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                          Denied
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(p.feedbackProcess)}
                      {p.feedbackProcess?.scheduledAt && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(p.feedbackProcess.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedPurchase(p)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="View Full Details"
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

      {/* Add Manual Bill Modal */}
      <AddPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPurchaseCreated={() => fetchPurchases()}
      />

      {/* Inspection Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Invoice Details</h3>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Invoice Number</span>
                <span className="font-mono font-bold text-slate-800">{selectedPurchase.invoiceNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Customer Name</span>
                <span className="font-semibold text-slate-800">{selectedPurchase.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Phone (Raw & Normalized)</span>
                <span className="font-mono text-slate-800">{selectedPurchase.normalizedPhoneNumber || selectedPurchase.phoneNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Amount</span>
                <span className="font-bold text-slate-900 text-sm">₹{Number(selectedPurchase.totalAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Items Summary</span>
                <span className="text-slate-800 text-right font-medium max-w-[200px]">{selectedPurchase.itemsSummary}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Scheduled Call Time</span>
                <span className="font-medium text-amber-600">
                  {selectedPurchase.feedbackProcess?.scheduledAt
                    ? new Date(selectedPurchase.feedbackProcess.scheduledAt).toLocaleString()
                    : 'Not scheduled'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Calling Status</span>
                <div>{getStatusBadge(selectedPurchase.feedbackProcess)}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
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
