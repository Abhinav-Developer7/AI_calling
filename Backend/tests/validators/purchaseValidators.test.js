import { describe, it, expect } from 'vitest';
import { createPurchaseSchema, listPurchasesSchema } from '../../src/validators/purchaseValidators.js';

describe('Purchase Validators', () => {
  it('should successfully validate a correct purchase creation payload', async () => {
    const validData = {
      body: {
        invoiceNumber: 'INV-2026-001',
        customerName: 'Aiswarya Lakshmi',
        phoneNumber: '+919876543210',
        totalAmount: 45000,
        itemsSummary: 'Gold Bangle 22K 8g',
        feedbackCallConsent: true,
      },
    };

    const parsed = await createPurchaseSchema.parseAsync(validData);
    expect(parsed.body.invoiceNumber).toBe('INV-2026-001');
    expect(parsed.body.customerName).toBe('Aiswarya Lakshmi');
    expect(parsed.body.totalAmount).toBe(45000);
    expect(parsed.body.feedbackCallConsent).toBe(true);
    expect(parsed.body.source).toBe('manual_entry'); // Default value
    expect(parsed.body.currency).toBe('INR'); // Default value
  });

  it('should reject payload missing required fields', async () => {
    const invalidData = {
      body: {
        customerName: 'Aiswarya Lakshmi',
        // missing invoiceNumber, phoneNumber, totalAmount, itemsSummary
      },
    };

    await expect(createPurchaseSchema.parseAsync(invalidData)).rejects.toThrow();
  });

  it('should reject invalid amount (< 0)', async () => {
    const invalidData = {
      body: {
        invoiceNumber: 'INV-002',
        customerName: 'Test Customer',
        phoneNumber: '9876543210',
        totalAmount: -100,
        itemsSummary: 'Ring',
      },
    };

    await expect(createPurchaseSchema.parseAsync(invalidData)).rejects.toThrow();
  });
});

