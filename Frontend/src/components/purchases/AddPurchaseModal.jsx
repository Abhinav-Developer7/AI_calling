import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { X, Plus, AlertCircle, CheckCircle, Sparkles, Clock } from 'lucide-react';

export function AddPurchaseModal({ isOpen, onClose, onPurchaseCreated }) {
  const generateRandomInvoice = () => `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const [formData, setFormData] = useState({
    invoiceNumber: generateRandomInvoice(),
    customerName: '',
    phoneNumber: '',
    totalAmount: '',
    itemsSummary: '',
    branchId: 'Ernakulam Main Store',
    feedbackCallConsent: true,
    delayOption: '0', // Default to Immediate (0) for instant automatic calling
    customDelay: '5',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const delayMinutes =
        formData.delayOption === '0'
          ? 0
          : formData.delayOption === 'custom'
          ? parseInt(formData.customDelay, 10) || 15
          : 15;

      const payload = {
        source: 'manual_entry',
        invoiceNumber: formData.invoiceNumber.trim(),
        customerName: formData.customerName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        totalAmount: parseFloat(formData.totalAmount) || 0,
        itemsSummary: formData.itemsSummary.trim(),
        branchId: formData.branchId,
        feedbackCallConsent: formData.feedbackCallConsent,
        customDelayMinutes: delayMinutes,
        purchaseDate: new Date().toISOString(),
      };

      const res = await apiClient.post('/purchases', payload);

      if (res.data.success) {
        if (res.data.duplicate) {
          setError(`Notice: Bill with invoice #${payload.invoiceNumber} already exists in the system.`);
        } else {
          const successText =
            delayMinutes === 0
              ? `Bill saved! AI calling agent is placing call to ${payload.customerName} now...`
              : `Bill saved! Feedback call scheduled for: ${new Date(res.data.scheduledAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`;
          setSuccessMsg(successText);
          if (onPurchaseCreated) {
            onPurchaseCreated(res.data.purchase);
          }
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || err.message;
      setError(msg || 'Failed to save purchase bill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Add Manual Purchase Bill</h3>
              <p className="text-[11px] text-slate-400">Test post-purchase AI calling workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Number *
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  required
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  title="Generate new invoice number"
                  onClick={() => setFormData((p) => ({ ...p, invoiceNumber: generateRandomInvoice() }))}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch / Store Location
              </label>
              <select
                name="branchId"
                value={formData.branchId}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              >
                <option value="Ernakulam Main Store">Ernakulam Main Store</option>
                <option value="Thrissur Branch">Thrissur Branch</option>
                <option value="Kozhikode Branch">Kozhikode Branch</option>
                <option value="Trivandrum Branch">Trivandrum Branch</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                name="customerName"
                placeholder="e.g. Sreejith Varma"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Phone Number *
              </label>
              <input
                type="text"
                required
                name="phoneNumber"
                placeholder="e.g. +91 98765 43210"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Amount (INR) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                name="totalAmount"
                placeholder="e.g. 75000"
                value={formData.totalAmount}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchased Jewellery Items *
              </label>
              <input
                type="text"
                required
                name="itemsSummary"
                placeholder="e.g. Gold Necklace 22k 16g"
                value={formData.itemsSummary}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Testing Call Delay Option */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Feedback Call Schedule Timing</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <label
                className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer transition ${
                  formData.delayOption === '15'
                    ? 'bg-amber-500 text-slate-950 font-semibold border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="delayOption"
                  value="15"
                  checked={formData.delayOption === '15'}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <span>15 Mins (Default)</span>
              </label>

              <label
                className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer transition ${
                  formData.delayOption === '0'
                    ? 'bg-amber-500 text-slate-950 font-semibold border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="delayOption"
                  value="0"
                  checked={formData.delayOption === '0'}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <span>Immediate (Test)</span>
              </label>

              <label
                className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer transition ${
                  formData.delayOption === 'custom'
                    ? 'bg-amber-500 text-slate-950 font-semibold border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="delayOption"
                  value="custom"
                  checked={formData.delayOption === 'custom'}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <span>Custom Delay</span>
              </label>
            </div>

            {formData.delayOption === 'custom' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="1"
                  max="120"
                  name="customDelay"
                  value={formData.customDelay}
                  onChange={handleInputChange}
                  className="w-20 bg-white border border-slate-200 rounded p-1 text-xs text-slate-800"
                />
                <span className="text-xs text-slate-600">minutes after purchase</span>
              </div>
            )}
          </div>

          {/* Feedback Consent Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="feedbackCallConsent"
                checked={formData.feedbackCallConsent}
                onChange={handleInputChange}
                className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs text-slate-600">
                Customer provided explicit consent to receive a feedback call for this purchase (unchecking will set status to <span className="font-semibold text-slate-800">skipped</span>).
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  Saving Bill...
                </>
              ) : (
                'Save & Schedule Call'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

