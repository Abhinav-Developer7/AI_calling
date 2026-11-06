import { FeedbackProcess } from '../models/FeedbackProcess.js';
import { Purchase } from '../models/Purchase.js';
import { CallAttempt } from '../models/CallAttempt.js';
import { Feedback } from '../models/Feedback.js';
import {
  cancelFeedbackProcess,
  rescheduleFeedbackProcess,
  markCustomerDoNotCall,
  executeCallAttempt,
} from '../services/callingService.js';

export async function listProcesses(req, res, next) {
  try {
    const { status, search, page = 1, limit = 5 } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.callStatus = status;
    }

    // If search term provided, find matching purchase IDs first
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

      query.purchaseId = { $in: matchingPurchases.map((p) => p._id) };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);
    const skip = (pageNum - 1) * limitNum;

    const [processes, total] = await Promise.all([
      FeedbackProcess.find(query)
        .populate('purchaseId')
        .sort({ scheduledAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FeedbackProcess.countDocuments(query),
    ]);

    // Attach latest attempt and feedback to each item
    const processIds = processes.map((p) => p._id);
    const [attempts, feedbacks] = await Promise.all([
      CallAttempt.find({ feedbackProcessId: { $in: processIds } }).sort({ attemptNumber: -1 }).lean(),
      Feedback.find({ feedbackProcessId: { $in: processIds } }).lean(),
    ]);

    const attemptMap = new Map();
    for (const att of attempts) {
      const key = att.feedbackProcessId.toString();
      if (!attemptMap.has(key)) attemptMap.set(key, []);
      attemptMap.get(key).push(att);
    }

    const feedbackMap = new Map(feedbacks.map((f) => [f.feedbackProcessId.toString(), f]));

    const enrichedProcesses = processes.map((proc) => ({
      ...proc,
      purchase: proc.purchaseId,
      attempts: attemptMap.get(proc._id.toString()) || [],
      feedback: feedbackMap.get(proc._id.toString()) || null,
    }));

    return res.status(200).json({
      success: true,
      processes: enrichedProcesses,
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

export async function getProcess(req, res, next) {
  try {
    const process = await FeedbackProcess.findById(req.params.id).populate('purchaseId').lean();
    if (!process) {
      return res.status(404).json({ success: false, message: 'Feedback process not found' });
    }

    const [attempts, feedback] = await Promise.all([
      CallAttempt.find({ feedbackProcessId: process._id }).sort({ attemptNumber: 1 }).lean(),
      Feedback.findOne({ feedbackProcessId: process._id }).lean(),
    ]);

    return res.status(200).json({
      success: true,
      process: {
        ...process,
        purchase: process.purchaseId,
        attempts,
        feedback,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelProcess(req, res, next) {
  try {
    const { reason } = req.body;
    const process = await cancelFeedbackProcess(req.params.id, reason, req.user?._id);

    return res.status(200).json({
      success: true,
      message: 'Calling process successfully cancelled',
      process,
    });
  } catch (error) {
    next(error);
  }
}

export async function rescheduleProcess(req, res, next) {
  try {
    const { scheduledTime } = req.body;
    if (!scheduledTime) {
      return res.status(400).json({ success: false, message: 'scheduledTime is required' });
    }

    const process = await rescheduleFeedbackProcess(req.params.id, scheduledTime, req.user?._id);

    return res.status(200).json({
      success: true,
      message: 'Calling process successfully rescheduled',
      process,
    });
  } catch (error) {
    next(error);
  }
}

export async function optOutProcess(req, res, next) {
  try {
    const { reason } = req.body;
    const process = await markCustomerDoNotCall(req.params.id, reason, req.user?._id);

    return res.status(200).json({
      success: true,
      message: 'Customer successfully added to Do-Not-Call opt-out registry',
      process,
    });
  } catch (error) {
    next(error);
  }
}

export async function triggerCallNow(req, res, next) {
  try {
    const result = await executeCallAttempt(req.params.id, `admin-manual-${req.user?._id}`);
    return res.status(200).json({
      success: result.success,
      message: result.success
        ? 'Call attempt initiated successfully'
        : (result.error || result.reason || 'Call initiation failed'),
      result,
    });
  } catch (error) {
    next(error);
  }
}

