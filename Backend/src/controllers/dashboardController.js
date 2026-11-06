import { Purchase } from '../models/Purchase.js';
import { FeedbackProcess, CallStatus } from '../models/FeedbackProcess.js';
import { Feedback } from '../models/Feedback.js';
import { Complaint, ComplaintStatus } from '../models/Complaint.js';
import { getStoreSettings } from '../services/settingsService.js';

/**
 * Retrieves high-level dashboard KPIs calculated entirely on the server.
 * All percentages and definitions are unified here.
 */
export async function getDashboardOverview(req, res, next) {
  try {
    const [
      totalPurchases,
      callsScheduled,
      callsCompleted,
      callsFailedOrNoAnswer,
      ratingStats,
      openComplaints,
      sentimentAgg,
      settings,
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
      Feedback.aggregate([
        {
          $group: {
            _id: '$sentiment',
            count: { $sum: 1 },
          },
        },
      ]),
      getStoreSettings(),
    ]);

    // Average rating
    const avgRating = ratingStats.length > 0 && typeof ratingStats[0].avgRating === 'number'
      ? Number(ratingStats[0].avgRating.toFixed(1))
      : 0;

    // Feedback collection rate (completed / total purchases)
    const feedbackCollectionRate = totalPurchases > 0
      ? Math.min(100, Math.round((callsCompleted / totalPurchases) * 100))
      : 0;

    // Explicit definition of Favorable: Positive / Total Responded
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    for (const item of sentimentAgg) {
      const s = String(item._id || '').toLowerCase();
      if (s === 'positive') positiveCount = item.count;
      else if (s === 'neutral') neutralCount = item.count;
      else if (s === 'negative') negativeCount = item.count;
    }

    const totalResponded = positiveCount + neutralCount + negativeCount;
    const favorablePercentage = totalResponded > 0
      ? Math.min(100, Math.round((positiveCount / totalResponded) * 100))
      : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalPurchases,
        callsScheduled,
        callsCompleted,
        callsFailedOrNoAnswer,
        avgRating,
        openComplaints,
        feedbackCollectionRate,
        favorablePercentage,
        sentimentCounts: {
          positive: positiveCount,
          neutral: neutralCount,
          negative: negativeCount,
          total: totalResponded,
        },
        callingWindow: {
          start: settings.callingHoursStart,
          end: settings.callingHoursEnd,
          timezone: settings.timezone,
        },
        storeInfo: {
          storeName: settings.storeName,
          brandDisplayName: settings.brandDisplayName,
          branchName: settings.branchName,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves detailed distributions with zero-handling guaranteed.
 */
export async function getCallStatistics(req, res, next) {
  try {
    const [callStatusDistribution, ratingAgg, sentimentAgg] = await Promise.all([
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

    // Build complete 1 to 5 star rating distribution guaranteed
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRatings = 0;

    for (const item of ratingAgg) {
      const star = parseInt(item._id, 10);
      if (star >= 1 && star <= 5) {
        ratingCounts[star] = item.count;
        totalRatings += item.count;
      }
    }

    const normalizedRatingDistribution = [1, 2, 3, 4, 5].map((star) => ({
      star,
      name: `${star} ★`,
      count: ratingCounts[star],
      percentage: totalRatings > 0 ? Math.round((ratingCounts[star] / totalRatings) * 100) : 0,
    }));

    // Build unified sentiment distribution with strict percentage reconciliation
    let positive = 0;
    let neutral = 0;
    let negative = 0;

    for (const item of sentimentAgg) {
      const s = String(item._id || '').toLowerCase();
      if (s === 'positive') positive = item.count;
      else if (s === 'neutral') neutral = item.count;
      else if (s === 'negative') negative = item.count;
    }

    const totalSentiment = positive + neutral + negative;
    const normalizedSentimentDistribution = [
      {
        name: 'POSITIVE',
        label: 'Positive',
        value: positive,
        percentage: totalSentiment > 0 ? Math.round((positive / totalSentiment) * 100) : 0,
        color: '#10b981',
      },
      {
        name: 'NEUTRAL',
        label: 'Neutral',
        value: neutral,
        percentage: totalSentiment > 0 ? Math.round((neutral / totalSentiment) * 100) : 0,
        color: '#f59e0b',
      },
      {
        name: 'NEGATIVE',
        label: 'Negative',
        value: negative,
        percentage: totalSentiment > 0 ? Math.round((negative / totalSentiment) * 100) : 0,
        color: '#f43f5e',
      },
    ];

    return res.status(200).json({
      success: true,
      callStatusDistribution,
      ratingDistribution: normalizedRatingDistribution,
      sentimentDistribution: normalizedSentimentDistribution,
      totalRatings,
      totalSentiment,
      favorablePercentage: totalSentiment > 0 ? Math.round((positive / totalSentiment) * 100) : 0,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves recent activity for the dashboard.
 */
export async function getRecentActivity(req, res, next) {
  try {
    const [recentPurchases, recentCompletedCalls, activeComplaints] = await Promise.all([
      Purchase.find().sort({ createdAt: -1 }).limit(10).lean(),
      Feedback.find()
        .populate({
          path: 'feedbackProcessId',
          populate: { path: 'purchaseId' },
        })
        .sort({ collectedAt: -1 })
        .limit(10)
        .lean(),
      Complaint.find({ status: { $in: [ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS] } })
        .populate('purchaseId')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      recentPurchases,
      recentCompletedCalls: recentCompletedCalls.map((c) => ({
        ...c,
        customerName: c.feedbackProcessId?.purchaseId?.customerName || 'Customer',
        invoiceNumber: c.feedbackProcessId?.purchaseId?.invoiceNumber || 'N/A',
        phoneNumber: c.feedbackProcessId?.purchaseId?.normalizedPhoneNumber || c.feedbackProcessId?.purchaseId?.phoneNumber || '',
        itemsSummary: c.feedbackProcessId?.purchaseId?.itemsSummary || 'Jewellery',
        branchId: c.feedbackProcessId?.purchaseId?.branchId || '',
        totalAmount: c.feedbackProcessId?.purchaseId?.totalAmount || 0,
      })),
      activeComplaints: activeComplaints.map((c) => ({
        ...c,
        customerName: c.purchaseId?.customerName || 'Customer',
        invoiceNumber: c.purchaseId?.invoiceNumber || 'N/A',
        phoneNumber: c.purchaseId?.normalizedPhoneNumber || c.purchaseId?.phoneNumber || '',
      })),
    });
  } catch (error) {
    next(error);
  }
}
