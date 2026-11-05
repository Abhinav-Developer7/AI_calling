import { Feedback } from '../models/Feedback.js';
import { FeedbackProcess } from '../models/FeedbackProcess.js';
import { Purchase } from '../models/Purchase.js';
import { CallAttempt } from '../models/CallAttempt.js';

export async function listFeedback(req, res, next) {
  try {
    const { rating, sentiment, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (rating && rating !== 'all') {
      query.overallRating = parseInt(rating, 10);
    }

    if (sentiment && sentiment !== 'all') {
      query.sentiment = sentiment;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(query)
        .populate({
          path: 'feedbackProcessId',
          populate: { path: 'purchaseId' },
        })
        .populate('callAttemptId')
        .sort({ collectedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Feedback.countDocuments(query),
    ]);

    const enrichedFeedbacks = feedbacks.map((fb) => ({
      ...fb,
      purchase: fb.feedbackProcessId?.purchaseId || null,
      process: fb.feedbackProcessId || null,
      callAttempt: fb.callAttemptId || null,
    }));

    return res.status(200).json({
      success: true,
      feedbacks: enrichedFeedbacks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getFeedback(req, res, next) {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate({
        path: 'feedbackProcessId',
        populate: { path: 'purchaseId' },
      })
      .populate('callAttemptId')
      .lean();

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback record not found' });
    }

    return res.status(200).json({
      success: true,
      feedback: {
        ...feedback,
        purchase: feedback.feedbackProcessId?.purchaseId || null,
        process: feedback.feedbackProcessId || null,
        callAttempt: feedback.callAttemptId || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

