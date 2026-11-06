import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { formatDateTimeIST, formatTimeIST } from '../../utils/date';
import { maskPhoneNumber } from '../../utils/phone';
import { AddPurchaseModal } from '../../components/purchases/AddPurchaseModal';
import { Drawer } from '../../components/ui/Drawer';
import { StatusPill } from '../../components/ui/StatusPill';
import { Pagination } from '../../components/ui/Pagination';
import {
  Search,
  RefreshCw,
  Plus,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';

export function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 5 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [revealedPhones, setRevealedPhones] = useState({});
  const [copiedInvoice, setCopiedInvoice] = useState(null);

  const fetchPurchases = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/purchases', {
        params: {
          search: search.trim() || undefined,
          page: targetPage,
          limit: 5,
        },
      });
      if (res.data?.success) {
        setPurchases(res.data.purchases || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load purchase records');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchPurchases(page);
  }, [page, fetchPurchases]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPurchases(1);
  };

  const handleCopyInvoice = (invoiceNumber) => {
    navigator.clipboard.writeText(invoiceNumber);
    setCopiedInvoice(invoiceNumber);
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  const togglePhoneReveal = (id) => {
    setRevealedPhones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-ink tracking-tight">Purchases</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Ingested billing invoices and automated post-purchase call status.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-accent-ink font-semibold rounded-pill text-xs shadow-soft transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Purchase Call</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-surface p-3.5 rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] shadow-soft flex flex-wrap gap-3 items-center justify-between"
      >
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-ink-soft stroke-[1.75]" />
          <input
            type="text"
            placeholder="Search invoice number, customer name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-muted hover:bg-black/[0.06] dark:hover:bg-white/[0.06] rounded-pill pl-9 pr-3 py-1.5 text-xs text-ink placeholder-ink-soft border border-transparent focus:border-black/10 focus:outline-none transition shadow-none"
          />
        </div>

        <button
          type="button"
          onClick={() => { setPage(1); fetchPurchases(1); }}
          disabled={loading}
          aria-label="Refresh purchases"
          className="flex items-center gap-2 px-3.5 py-1.5 bg-surface-muted hover:bg-black/[0.06] dark:hover:bg-white/[0.06] rounded-pill text-xs font-semibold text-ink transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
          <span>Refresh</span>
        </button>
      </form>

      {error && (
        <div className="p-3 bg-status-danger-bg border border-status-danger-ink/20 text-status-danger-ink rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
          <span>{error}</span>
        </div>
      )}

      {/* Purchases Data Table */}
      <div className="bg-surface rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] shadow-soft overflow-hidden">
        <div className="overflow-x-auto relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-elevated text-[11px] uppercase font-semibold text-ink-soft border-b border-black/[0.04] dark:border-white/[0.06] sticky top-0 z-20">
              <tr>
                <th className="px-5 py-3.5 sticky left-0 bg-surface-elevated z-30 min-w-[160px] border-r border-black/[0.04] dark:border-white/[0.06]">
                  Invoice #
                </th>
                <th className="px-4 py-3.5 min-w-[170px]">Customer</th>
                <th className="px-4 py-3.5 min-w-[200px] max-w-xs">Items Summary</th>
                <th className="px-4 py-3.5 min-w-[120px]">Amount</th>
                <th className="px-4 py-3.5 min-w-[120px]">Branch</th>
                <th className="px-4 py-3.5 min-w-[100px]">Consent</th>
                <th className="px-4 py-3.5 min-w-[150px]">Calling Status</th>
                <th className="px-4 py-3.5 text-right min-w-[80px] sticky right-0 bg-surface-elevated z-20 border-l border-black/[0.04] dark:border-white/[0.06]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
              {loading && purchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-14 text-center text-ink-soft">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Loading purchase records...</p>
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-14 text-center text-ink-soft">
                    <p className="text-xs font-semibold text-ink">No purchase records found</p>
                    <p className="text-[11px] mt-0.5">
                      Click <strong className="text-ink font-bold">"New Purchase Call"</strong> to record a transaction.
                    </p>
                  </td>
                </tr>
              ) : (
                purchases.map((p) => {
                  const rawPhone = p.phoneNumber || '';
                  const isPhoneRevealed = Boolean(revealedPhones[p._id]);
                  const displayedPhone = isPhoneRevealed ? rawPhone : maskPhoneNumber(rawPhone);

                  return (
                    <tr key={p._id} className="hover:bg-surface-elevated/70 transition group">
                      {/* Sticky Invoice Column */}
                      <td className="px-5 py-3.5 sticky left-0 bg-surface group-hover:bg-surface-elevated z-10 border-r border-black/[0.04] dark:border-white/[0.06]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-ink text-xs whitespace-nowrap">
                            {p.invoiceNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyInvoice(p.invoiceNumber)}
                            title="Copy invoice"
                            aria-label="Copy invoice"
                            className="text-ink-soft hover:text-ink p-0.5 cursor-pointer"
                          >
                            {copiedInvoice === p.invoiceNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Customer Name & Masked Phone */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-ink text-xs truncate max-w-[150px]">
                          {p.customerName}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[11px] text-ink-soft font-mono whitespace-nowrap">
                            {displayedPhone}
                          </span>
                          {rawPhone && (
                            <button
                              type="button"
                              onClick={() => togglePhoneReveal(p._id)}
                              title={isPhoneRevealed ? 'Mask phone' : 'Reveal phone'}
                              aria-label={isPhoneRevealed ? 'Mask phone' : 'Reveal phone'}
                              className="text-ink-soft hover:text-ink p-0.5 cursor-pointer"
                            >
                              {isPhoneRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5 text-ink-secondary max-w-xs truncate" title={p.itemsSummary}>
                        {p.itemsSummary || '—'}
                      </td>

                      {/* Amount in INR */}
                      <td className="px-4 py-3.5 font-bold text-ink tabular-nums whitespace-nowrap">
                        ₹{Number(p.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Branch */}
                      <td className="px-4 py-3.5 text-ink-soft whitespace-nowrap">
                        {p.branchId || 'Ernakulam Store'}
                      </td>

                      {/* Consent */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {p.feedbackCallConsent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-status-success-bg text-status-success-ink">
                            Granted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-surface-muted text-ink-soft">
                            Denied
                          </span>
                        )}
                      </td>

                      {/* Calling Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusPill
                          status={p.feedbackProcess?.callStatus || 'pending'}
                          label={p.feedbackProcess?.callStatus || 'Pending'}
                        />
                        {p.feedbackProcess?.scheduledAt && (
                          <p className="text-[10px] text-ink-soft tabular-nums mt-0.5 font-mono">
                            {formatTimeIST(p.feedbackProcess.scheduledAt)}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap sticky right-0 bg-surface group-hover:bg-surface-elevated z-10 border-l border-black/[0.04] dark:border-white/[0.06]">
                        <button
                          onClick={() => setSelectedPurchase(p)}
                          className="p-1.5 text-ink-soft hover:text-ink hover:bg-surface-muted rounded-lg transition cursor-pointer"
                          title="View invoice details"
                          aria-label="View invoice details"
                        >
                          <Eye className="w-4 h-4 stroke-[1.75]" />
                        </button>
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
        page={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || 0}
        limit={5}
        onPageChange={handlePageChange}
        loading={loading}
      />

      {/* Add Manual Bill Modal */}
      <AddPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPurchaseCreated={() => { setPage(1); fetchPurchases(1); }}
      />

      {/* Purchase Detail Slide-Over Drawer */}
      <Drawer
        isOpen={Boolean(selectedPurchase)}
        onClose={() => setSelectedPurchase(null)}
        title={selectedPurchase?.customerName || 'Purchase Details'}
        subtitle={`Invoice #${selectedPurchase?.invoiceNumber || '—'}`}
        width="max-w-md"
      >
        {selectedPurchase && (
          <div className="space-y-4 text-xs font-sans">
            <div className="space-y-2 divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              <div className="flex justify-between py-2">
                <span className="text-ink-soft">Invoice Number</span>
                <span className="font-mono font-semibold text-ink">{selectedPurchase.invoiceNumber}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-soft">Customer Name</span>
                <span className="font-semibold text-ink">{selectedPurchase.customerName}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-soft">Phone Number</span>
                <span className="font-mono text-ink">
                  {selectedPurchase.normalizedPhoneNumber || selectedPurchase.phoneNumber}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-soft">Total Amount</span>
                <span className="font-bold text-ink text-sm tabular-nums">
                  ₹{Number(selectedPurchase.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-soft">Items Summary</span>
                <span className="text-ink-secondary text-right font-medium max-w-[200px]">
                  {selectedPurchase.itemsSummary || '—'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-soft">Branch</span>
                <span className="text-ink-secondary">{selectedPurchase.branchId || 'Ernakulam Flagship Store'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-soft">Purchase Date (IST)</span>
                <span className="text-ink-secondary font-mono tabular-nums">
                  {formatDateTimeIST(selectedPurchase.purchaseDate || selectedPurchase.createdAt)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-soft">Calling Status</span>
                <div>
                  <StatusPill
                    status={selectedPurchase.feedbackProcess?.callStatus || 'pending'}
                    label={selectedPurchase.feedbackProcess?.callStatus || 'Pending'}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-between items-center border-t border-black/[0.04] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => handleCopyInvoice(selectedPurchase.invoiceNumber)}
                className="px-3.5 py-1.5 rounded-pill bg-surface-muted hover:bg-black/[0.06] dark:hover:bg-white/[0.06] text-xs font-medium text-ink flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Invoice</span>
              </button>

              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-1.5 bg-surface-muted hover:bg-black/[0.06] dark:hover:bg-white/[0.06] rounded-pill text-xs font-semibold text-ink transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
