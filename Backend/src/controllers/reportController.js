import { Feedback } from '../models/Feedback.js';
import { Purchase } from '../models/Purchase.js';
import { Complaint } from '../models/Complaint.js';
import { maskPhoneNumber } from '../utils/logger.js';

export async function getReportSummary(req, res, next) {
  try {
    const { startDate, endDate, branchId } = req.query;

    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.purchaseDate = {};
      if (startDate) matchQuery.purchaseDate.$gte = new Date(startDate);
      if (endDate) matchQuery.purchaseDate.$lte = new Date(endDate);
    }
    if (branchId && branchId !== 'all') {
      matchQuery.branchId = branchId;
    }

    const [totalPurchases, totalFeedback, totalComplaints] = await Promise.all([
      Purchase.countDocuments(matchQuery),
      Feedback.countDocuments(),
      Complaint.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      summary: {
        totalPurchases,
        totalFeedback,
        totalComplaints,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function exportReportCSV(req, res, next) {
  try {
    const feedbacks = await Feedback.find()
      .populate({
        path: 'feedbackProcessId',
        populate: { path: 'purchaseId' },
      })
      .sort({ collectedAt: -1 })
      .lean();

    // Construct CSV Header
    const headers = [
      'Invoice Number',
      'Customer Name',
      'Customer Phone (Masked)',
      'Overall Rating',
      'Sentiment',
      'Language',
      'Conversation Summary',
      'Feedback Comments',
      'Complaint Flag',
      'Collected Date (UTC)',
    ];

    const rows = feedbacks.map((fb) => {
      const p = fb.feedbackProcessId?.purchaseId || {};
      const maskedPhone = maskPhoneNumber(p.phoneNumber || '');
      const escape = (val) => `"${String(val || '').replace(/"/g, '""')}"`;

      return [
        escape(p.invoiceNumber || 'N/A'),
        escape(p.customerName || 'Customer'),
        escape(maskedPhone),
        fb.overallRating !== null ? fb.overallRating : 'N/A',
        escape(fb.sentiment || 'neutral'),
        escape(fb.languageUsed || 'malayalam'),
        escape(fb.summary || ''),
        escape(fb.feedbackText || ''),
        fb.complaintDetected ? 'YES' : 'NO',
        escape(fb.collectedAt ? new Date(fb.collectedAt).toISOString() : ''),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=jewellery-feedback-report-${Date.now()}.csv`
    );

    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

