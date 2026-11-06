import { Feedback } from '../models/Feedback.js';
import { FeedbackProcess } from '../models/FeedbackProcess.js';
import { Purchase } from '../models/Purchase.js';
import { CallAttempt } from '../models/CallAttempt.js';

export async function listFeedback(req, res, next) {
  try {
    const { rating, sentiment, language, search, page = 1, limit = 5 } = req.query;

    const query = {};

    if (rating && rating !== 'all') {
      query.overallRating = parseInt(rating, 10);
    }

    if (sentiment && sentiment !== 'all') {
      query.sentiment = sentiment;
    }

    if (language && language !== 'all') {
      query.language = language;
    }

    if (search && search.trim()) {
      const term = search.trim();
      const matchingPurchases = await Purchase.find({
        $or: [
          { invoiceNumber: { $regex: term, $options: 'i' } },
          { customerName: { $regex: term, $options: 'i' } },
          { phoneNumber: { $regex: term, $options: 'i' } },
          { normalizedPhoneNumber: { $regex: term, $options: 'i' } },
        ],
      }).select('_id');

      const matchingProcesses = await FeedbackProcess.find({
        purchaseId: { $in: matchingPurchases.map((p) => p._id) },
      }).select('_id');

      query.$or = [
        { feedbackProcessId: { $in: matchingProcesses.map((p) => p._id) } },
        { summaryText: { $regex: term, $options: 'i' } },
        { customerComments: { $regex: term, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);
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

export async function streamFeedbackRecording(req, res, next) {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback || !feedback.recordingUrl) {
      return res.status(404).json({ success: false, message: 'Audio recording not found' });
    }

    const recordingUrl = feedback.recordingUrl;

    const rangeHeader = req.headers.range;
    const fetchHeaders = {};
    if (rangeHeader) {
      fetchHeaders.Range = rangeHeader;
    }

    const audioResponse = await fetch(recordingUrl, { headers: fetchHeaders });

    res.status(audioResponse.status);

    ['content-range', 'content-length', 'content-type', 'accept-ranges'].forEach((h) => {
      const val = audioResponse.headers.get(h);
      if (val) res.setHeader(h, val);
    });

    if (!audioResponse.headers.get('content-type')) {
      res.setHeader('content-type', 'audio/mpeg');
    }
    if (!audioResponse.headers.get('accept-ranges')) {
      res.setHeader('accept-ranges', 'bytes');
    }

    const arrayBuffer = await audioResponse.arrayBuffer();
    return res.end(Buffer.from(arrayBuffer));
  } catch (error) {
    next(error);
  }
}

