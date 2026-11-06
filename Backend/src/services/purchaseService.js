import { Purchase } from '../models/Purchase.js';
import { Customer } from '../models/Customer.js';
import { FeedbackProcess, CallStatus, FeedbackStatus } from '../models/FeedbackProcess.js';
import { OptOutRegistry } from '../models/OptOutRegistry.js';
import { normalizePhoneNumber } from '../utils/phone.js';
import { toTitleCase } from '../utils/string.js';
import { scheduleFeedbackCallJob } from '../queues/callingQueue.js';
import { executeCallAttempt } from './callingService.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function createPurchaseAndSchedule({
  source = 'manual_entry',
  externalPurchaseId,
  invoiceNumber,
  customerName,
  phoneNumber,
  purchaseDate = new Date(),
  totalAmount,
  currency = 'INR',
  itemsSummary,
  branchId = 'main_branch',
  feedbackCallConsent = true,
  consentCapturedAt = new Date(),
  customDelayMinutes,
}) {
  // 1. Normalize phone number
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  // 2. Enforce externalPurchaseId if not supplied
  const resolvedExternalId = externalPurchaseId || `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // 3. Idempotency Check: Existing Purchase
  const existingPurchase = await Purchase.findOne({
    $or: [
      { source, externalPurchaseId: resolvedExternalId },
      { invoiceNumber },
    ],
  });

  if (existingPurchase) {
    const existingProcess = await FeedbackProcess.findOne({ purchaseId: existingPurchase._id });
    logger.info(
      { invoiceNumber, externalPurchaseId: resolvedExternalId },
      'Duplicate purchase event ignored idempotently'
    );
    return {
      purchase: existingPurchase,
      feedbackProcess: existingProcess,
      duplicate: true,
      message: 'Purchase already exists in the system',
    };
  }

  // 4. Opt-Out Suppression Check
  const isOptedOut = await OptOutRegistry.exists({ normalizedPhoneNumber });

  // 5. Deduplicate and normalize Customer record
  const properName = toTitleCase(customerName) || 'Customer';
  const purchaseDateObj = new Date(purchaseDate);
  const purchaseAmountNum = Number(totalAmount) || 0;

  let customer = await Customer.findOne({ normalizedPhoneNumber });
  if (!customer) {
    customer = await Customer.create({
      normalizedPhoneNumber,
      name: properName,
      originalPhoneNumber: phoneNumber,
      firstPurchaseDate: purchaseDateObj,
      lastPurchaseDate: purchaseDateObj,
      totalPurchasesCount: 1,
      totalSpent: purchaseAmountNum,
      isOptedOut: Boolean(isOptedOut),
    });
  } else {
    customer.lastPurchaseDate = purchaseDateObj;
    customer.totalPurchasesCount += 1;
    customer.totalSpent += purchaseAmountNum;
    if (properName && properName !== 'Customer') {
      customer.name = properName;
    }
    if (isOptedOut) {
      customer.isOptedOut = true;
    }
    await customer.save();
  }

  // 6. Create Purchase record linked to parent Customer
  const purchase = await Purchase.create({
    customerId: customer._id,
    source,
    externalPurchaseId: resolvedExternalId,
    invoiceNumber,
    customerName: customer.name,
    phoneNumber,
    normalizedPhoneNumber,
    purchaseDate: purchaseDateObj,
    totalAmount: purchaseAmountNum,
    currency,
    itemsSummary,
    branchId,
    feedbackCallConsent: Boolean(feedbackCallConsent),
    consentCapturedAt: new Date(consentCapturedAt),
    optedOut: Boolean(isOptedOut),
  });

  // 6. Calculate Scheduled Call Time (Rule: 15 minutes after purchase by default)
  const delayMinutes = customDelayMinutes !== undefined ? customDelayMinutes : env.CALL_DELAY_MINUTES;
  const pDate = new Date(purchase.purchaseDate);
  const scheduledAt = new Date(pDate.getTime() + delayMinutes * 60 * 1000);

  // 7. Determine initial call status
  let initialCallStatus = CallStatus.SCHEDULED;
  let cancellationReason = undefined;

  if (isOptedOut) {
    initialCallStatus = CallStatus.SKIPPED;
    cancellationReason = 'Customer phone number is registered in Do-Not-Call / Opt-Out Registry';
  } else if (!purchase.feedbackCallConsent) {
    initialCallStatus = CallStatus.SKIPPED;
    cancellationReason = 'Customer did not grant explicit consent for feedback calling';
  }

  // 8. Create linked FeedbackProcess (strictly 1 process per purchase)
  const feedbackProcess = await FeedbackProcess.create({
    purchaseId: purchase._id,
    callStatus: initialCallStatus,
    feedbackStatus: FeedbackStatus.NOT_STARTED,
    scheduledAt,
    attemptCount: 0,
    maxAttempts: env.MAX_CALL_ATTEMPTS,
    cancellationReason,
    doNotCall: Boolean(isOptedOut),
  });

  // 9. Enqueue background call job or trigger immediately
  if (initialCallStatus === CallStatus.SCHEDULED) {
    if (delayMinutes === 0 || scheduledAt <= new Date()) {
      // Trigger outbound call immediately and asynchronously
      setImmediate(() => {
        executeCallAttempt(feedbackProcess._id, 'auto-on-purchase')
          .then((res) => {
            if (res.success) {
              logger.info({ processId: feedbackProcess._id, callAttemptId: res.callAttemptId }, 'Automatic outbound call triggered on purchase');
            } else {
              logger.warn({ processId: feedbackProcess._id, reason: res.reason || res.error }, 'Automatic call attempt deferred or prevented');
            }
          })
          .catch((err) => {
            logger.error({ processId: feedbackProcess._id, err: err.message }, 'Failed auto-triggering call on purchase');
          });
      });
    } else {
      await scheduleFeedbackCallJob(feedbackProcess._id, scheduledAt);
    }
  }

  logger.info(
    {
      purchaseId: purchase._id,
      invoiceNumber: purchase.invoiceNumber,
      callStatus: initialCallStatus,
      scheduledAt,
    },
    'Successfully created purchase and linked feedback process'
  );

  return {
    purchase,
    feedbackProcess,
    duplicate: false,
    message: 'Purchase recorded and feedback process initialized',
  };
}

export async function getPurchasesList({
  search = '',
  branchId,
  page = 1,
  limit = 5,
  startDate,
  endDate,
}) {
  const query = {};

  if (search) {
    const trimmed = search.trim();
    query.$or = [
      { invoiceNumber: { $regex: trimmed, $options: 'i' } },
      { customerName: { $regex: trimmed, $options: 'i' } },
      { phoneNumber: { $regex: trimmed, $options: 'i' } },
      { normalizedPhoneNumber: { $regex: trimmed, $options: 'i' } },
    ];
  }

  if (branchId && branchId !== 'all') {
    query.branchId = branchId;
  }

  if (startDate || endDate) {
    query.purchaseDate = {};
    if (startDate) query.purchaseDate.$gte = new Date(startDate);
    if (endDate) query.purchaseDate.$lte = new Date(endDate);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 5);
  const skip = (pageNum - 1) * limitNum;

  const [purchases, total] = await Promise.all([
    Purchase.find(query).sort({ purchaseDate: -1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Purchase.countDocuments(query),
  ]);

  // Attach feedback process to each purchase
  const purchaseIds = purchases.map((p) => p._id);
  const processes = await FeedbackProcess.find({ purchaseId: { $in: purchaseIds } }).lean();
  const processMap = new Map(processes.map((proc) => [proc.purchaseId.toString(), proc]));

  const enrichedPurchases = purchases.map((p) => ({
    ...p,
    feedbackProcess: processMap.get(p._id.toString()) || null,
  }));

  return {
    purchases: enrichedPurchases,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
}

export async function getPurchaseDetails(purchaseId) {
  const purchase = await Purchase.findById(purchaseId).lean();
  if (!purchase) {
    throw new Error('Purchase not found');
  }

  const feedbackProcess = await FeedbackProcess.findOne({ purchaseId: purchase._id }).lean();

  return {
    ...purchase,
    feedbackProcess,
  };
}

