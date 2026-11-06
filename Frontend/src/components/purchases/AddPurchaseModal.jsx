import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../../api/client';
import { X, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

const purchaseFormSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Valid 10+ digit phone number is required'),
  totalAmount: z.coerce.number().positive('Amount must be positive'),
  itemsSummary: z.string().min(2, 'Purchased items description is required'),
  branchId: z.string().min(1, 'Branch selection is required'),
  feedbackCallConsent: z.boolean(),
  delayOption: z.enum(['0', '15', 'custom']),
  customDelay: z.coerce.number().optional(),
});

export function AddPurchaseModal({ isOpen, onClose, onPurchaseCreated }) {
  const generateRandomInvoice = () =>
    `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      invoiceNumber: generateRandomInvoice(),
      customerName: '',
      phoneNumber: '',
      totalAmount: '',
      itemsSummary: '',
      branchId: 'Ernakulam Flagship Store',
      feedbackCallConsent: true,
      delayOption: '0',
      customDelay: 5,
    },
  });

  const delayOption = watch('delayOption');

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    setServerError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const delayMinutes =
        data.delayOption === '0'
          ? 0
          : data.delayOption === 'custom'
          ? parseInt(data.customDelay, 10) || 15
          : 15;

      const payload = {
        source: 'manual_entry',
        invoiceNumber: data.invoiceNumber.trim(),
        customerName: data.customerName.trim(),
        phoneNumber: data.phoneNumber.trim(),
        totalAmount: data.totalAmount,
        itemsSummary: data.itemsSummary.trim(),
        branchId: data.branchId,
        feedbackCallConsent: data.feedbackCallConsent,
        customDelayMinutes: delayMinutes,
        purchaseDate: new Date().toISOString(),
      };

      const res = await apiClient.post('/purchases', payload);

      if (res.data?.success) {
        if (res.data.duplicate) {
          setServerError(`Bill with invoice #${payload.invoiceNumber} already exists in the system.`);
        } else {
          const successText =
            delayMinutes === 0
              ? `Saved. Automated feedback call queued for ${payload.customerName}.`
              : `Saved. Feedback call scheduled for 15 minutes after billing.`;
          setSuccessMsg(successText);
          if (onPurchaseCreated) {
            onPurchaseCreated(res.data.purchase);
          }
          setTimeout(() => {
            reset();
            onClose();
          }, 1200);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || err.message;
      setServerError(msg || 'Failed to record purchase bill.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 overflow-y-auto font-sans">
      <div className="bg-surface rounded-[28px] md:rounded-[32px] border border-black/[0.04] dark:border-white/[0.06] shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <h2 className="font-bold text-base text-ink tracking-tight">New Purchase Bill</h2>
            <p className="text-xs text-ink-soft mt-0.5">Record transaction and trigger feedback scheduling</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-full bg-surface-muted hover:bg-black/5 dark:hover:bg-white/5 text-ink transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 text-xs">
          {serverError && (
            <div className="p-3.5 bg-status-danger-bg border border-rose-500/20 text-status-danger-ink rounded-2xl flex items-center gap-2.5 text-xs font-medium shadow-soft">
              <AlertCircle className="w-4 h-4 shrink-0 stroke-[2]" />
              <span>{serverError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-status-success-bg border border-emerald-500/20 text-status-success-ink rounded-2xl flex items-center gap-2.5 text-xs font-medium shadow-soft">
              <CheckCircle className="w-4 h-4 shrink-0 stroke-[2]" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
                Invoice Number *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  {...register('invoiceNumber')}
                  className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="button"
                  title="Generate invoice"
                  onClick={() => setValue('invoiceNumber', generateRandomInvoice())}
                  className="p-2.5 bg-surface-muted hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-ink transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              {errors.invoiceNumber && (
                <p className="text-status-danger-ink text-[10px] mt-1 font-medium">{errors.invoiceNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
                Branch Location
              </label>
              <select
                {...register('branchId')}
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              >
                <option value="Ernakulam Flagship Store">Ernakulam Flagship Store</option>
                <option value="Thrissur Store">Thrissur Store</option>
                <option value="Kozhikode Store">Kozhikode Store</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
                Customer Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sreejith Varma"
                {...register('customerName')}
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2 text-xs text-ink placeholder-ink-soft/40 focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.customerName && (
                <p className="text-status-danger-ink text-[10px] mt-1 font-medium">{errors.customerName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
                Customer Phone Number *
              </label>
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                {...register('phoneNumber')}
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2 text-xs text-ink font-mono placeholder-ink-soft/40 focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.phoneNumber && (
                <p className="text-status-danger-ink text-[10px] mt-1 font-medium">{errors.phoneNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
                Total Amount (INR) *
              </label>
              <input
                type="number"
                placeholder="e.g. 75000"
                {...register('totalAmount')}
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2 text-xs text-ink tabular-nums placeholder-ink-soft/40 focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.totalAmount && (
                <p className="text-status-danger-ink text-[10px] mt-1 font-medium">{errors.totalAmount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
                Items Summary *
              </label>
              <input
                type="text"
                placeholder="e.g. Gold Necklace 22K 16g"
                {...register('itemsSummary')}
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2 text-xs text-ink placeholder-ink-soft/40 focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.itemsSummary && (
                <p className="text-status-danger-ink text-[10px] mt-1 font-medium">{errors.itemsSummary.message}</p>
              )}
            </div>
          </div>

          {/* Schedule Timing Options */}
          <div className="p-4 bg-surface-muted rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Clock className="w-3.5 h-3.5 text-ink-soft stroke-[2]" />
              <span>Feedback Call Timing</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label
                className={`flex items-center justify-center py-2 px-3 rounded-pill cursor-pointer text-xs font-semibold transition ${
                  delayOption === '15'
                    ? 'bg-accent text-accent-ink shadow-soft'
                    : 'bg-surface text-ink-soft hover:text-ink'
                }`}
              >
                <input type="radio" value="15" {...register('delayOption')} className="hidden" />
                <span>15 Mins</span>
              </label>

              <label
                className={`flex items-center justify-center py-2 px-3 rounded-pill cursor-pointer text-xs font-semibold transition ${
                  delayOption === '0'
                    ? 'bg-accent text-accent-ink shadow-soft'
                    : 'bg-surface text-ink-soft hover:text-ink'
                }`}
              >
                <input type="radio" value="0" {...register('delayOption')} className="hidden" />
                <span>Immediate</span>
              </label>

              <label
                className={`flex items-center justify-center py-2 px-3 rounded-pill cursor-pointer text-xs font-semibold transition ${
                  delayOption === 'custom'
                    ? 'bg-accent text-accent-ink shadow-soft'
                    : 'bg-surface text-ink-soft hover:text-ink'
                }`}
              >
                <input type="radio" value="custom" {...register('delayOption')} className="hidden" />
                <span>Custom</span>
              </label>
            </div>

            {delayOption === 'custom' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="1"
                  max="120"
                  {...register('customDelay')}
                  className="w-16 bg-surface border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-2.5 py-1 text-xs text-ink font-semibold tabular-nums"
                />
                <span className="text-ink-soft text-[11px]">minutes delay after billing</span>
              </div>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="px-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...register('feedbackCallConsent')}
                className="mt-0.5 rounded accent-accent"
              />
              <span className="text-[11px] text-ink-soft leading-relaxed">
                Customer provided explicit consent to receive a feedback call. (Unchecking marks record as skipped).
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-pill text-xs font-semibold text-ink-soft hover:text-ink hover:bg-surface-muted transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-pill text-xs font-semibold bg-accent text-accent-ink shadow-soft hover:brightness-105 active:scale-[0.98] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-accent-ink border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save & Schedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
