import { Purchase } from '../models/Purchase.js';
import { FeedbackProcess, CallStatus } from '../models/FeedbackProcess.js';
import { Feedback } from '../models/Feedback.js';
import { Complaint, ComplaintStatus } from '../models/Complaint.js';

export async function getDashboardOverview(req, res, next) {
  try {
    const [
      totalPurchases,
      callsScheduled,
      callsCompleted,
      callsFailedOrNoAnswer,
      ratingStats,
      openComplaints,
    ] = await Promise.all([
      Purchase.countDocuments(),
      FeedbackProcess.countDocuments({
        callStatus: { $in: [CallStatus.SCHEDULED, CallStatus.RETRY_SCHEDULED, CallStatus.QUEUED] },
      }),
      FeedbackProcess.countDocuments({ callStatus: CallStatus.COMPLETED }),
      FeedbackProcess.countDocuments({
        callStatus: { $in: [CallStatus.NO_ANSWER, CallStatus.BUSY, CallStatus.FAILED] },
      }),
      Feedback.aggregate([
        { $match: { overallRating: { $ne: null } } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$overallRating' },
            count: { $sum: 1 },
          },
        },
      ]),
      Complaint.countDocuments({
        status: { $in: [ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS] },
      }),
    ]);

    const avgRating = ratingStats.length > 0 ? Number(ratingStats[0].avgRating.toFixed(1)) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalPurchases,
        callsScheduled,
        callsCompleted,
        callsFailedOrNoAnswer,
        avgRating,
        openComplaints,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCallStatistics(req, res, next) {
  try {
    const [callStatusDistribution, ratingDistribution, sentimentDistribution] = await Promise.all([
      FeedbackProcess.aggregate([
        {
          $group: {
            _id: '$callStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      Feedback.aggregate([
        { $match: { overallRating: { $ne: null } } },
        {
          $group: {
            _id: '$overallRating',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Feedback.aggregate([
        {
          $group: {
            _id: '$sentiment',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      callStatusDistribution,
      ratingDistribution,
      sentimentDistribution,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecentActivity(req, res, next) {
  try {
    const [recentPurchases, recentCompletedCalls, activeComplaints] = await Promise.all([
      Purchase.find().sort({ createdAt: -1 }).limit(5).lean(),
      Feedback.find()
        .populate({
          path: 'feedbackProcessId',
          populate: { path: 'purchaseId' },
        })
        .sort({ collectedAt: -1 })
        .limit(5)
        .lean(),
      Complaint.find({ status: { $in: [ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS] } })
        .populate('purchaseId')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      recentPurchases,
      recentCompletedCalls: recentCompletedCalls.map((c) => ({
        ...c,
        customerName: c.feedbackProcessId?.purchaseId?.customerName || 'Customer',
        invoiceNumber: c.feedbackProcessId?.purchaseId?.invoiceNumber || 'N/A',
      })),
      activeComplaints: activeComplaints.map((c) => ({
        ...c,
        customerName: c.purchaseId?.customerName || 'Customer',
        invoiceNumber: c.purchaseId?.invoiceNumber || 'N/A',
      })),
    });
  } catch (error) {
    next(error);
  }
}

