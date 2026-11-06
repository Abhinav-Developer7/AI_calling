import {
  createPurchaseAndSchedule,
  getPurchasesList,
  getPurchaseDetails,
} from '../services/purchaseService.js';
import { Purchase } from '../models/Purchase.js';
import { AuditLog } from '../models/AuditLog.js';

export async function addPurchase(req, res, next) {
  try {
    const result = await createPurchaseAndSchedule(req.body);

    const statusCode = result.duplicate ? 200 : 201;
    return res.status(statusCode).json({
      success: true,
      message: result.message,
      duplicate: result.duplicate,
      purchaseId: result.purchase._id,
      purchase: result.purchase,
      feedbackProcess: result.feedbackProcess,
      scheduledAt: result.feedbackProcess?.scheduledAt,
    });
  } catch (error) {
    next(error);
  }
}

export async function listPurchases(req, res, next) {
  try {
    const data = await getPurchasesList(req.query);
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPurchase(req, res, next) {
  try {
    const purchase = await getPurchaseDetails(req.params.id);
    return res.status(200).json({
      success: true,
      purchase,
    });
  } catch (error) {
    next(error);
  }
}

export async function revealPurchasePII(req, res, next) {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    await AuditLog.create({
      actorUserId: req.user?._id,
      action: 'PII_REVEAL',
      resourceType: 'Purchase',
      resourceId: purchase._id.toString(),
      details: {
        customerName: purchase.customerName,
        invoiceNumber: purchase.invoiceNumber,
        reason: req.body?.reason || 'Dashboard phone reveal',
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      phoneNumber: purchase.phoneNumber,
    });
  } catch (error) {
    next(error);
  }
}

