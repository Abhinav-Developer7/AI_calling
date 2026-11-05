import { z } from 'zod';

export const createPurchaseSchema = z.object({
  body: z.object({
    source: z.string().default('manual_entry'),
    externalPurchaseId: z.string().optional(),
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    customerName: z.string().min(1, 'Customer name is required'),
    phoneNumber: z.string().min(10, 'Valid phone number is required'),
    purchaseDate: z.string().or(z.date()).optional(),
    totalAmount: z.number().min(0, 'Amount must be greater than or equal to 0'),
    currency: z.string().default('INR'),
    itemsSummary: z.string().min(1, 'Items summary is required'),
    branchId: z.string().default('main_branch'),
    feedbackCallConsent: z.boolean().default(true),
    consentCapturedAt: z.string().or(z.date()).optional(),
    customDelayMinutes: z.number().min(0).max(1440).optional(), // Optional custom delay for testing (e.g. 0 for immediate call)
  }),
});

export const listPurchasesSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    branchId: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

