import { Complaint, ComplaintStatus } from '../models/Complaint.js';
import { Purchase } from '../models/Purchase.js';
import { Feedback } from '../models/Feedback.js';
import { AuditLog } from '../models/AuditLog.js';

export async function listComplaints(req, res, next) {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate('purchaseId')
        .populate('feedbackId')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Complaint.countDocuments(query),
    ]);

    const enriched = complaints.map((c) => ({
      ...c,
      purchase: c.purchaseId,
      feedback: c.feedbackId,
    }));

    return res.status(200).json({
      success: true,
      complaints: enriched,
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

export async function getComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('purchaseId')
      .populate('feedbackId')
      .populate('resolvedBy', 'name email')
      .lean();

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint record not found' });
    }

    return res.status(200).json({
      success: true,
      complaint: {
        ...complaint,
        purchase: complaint.purchaseId,
        feedback: complaint.feedbackId,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function resolveComplaint(req, res, next) {
  try {
    const { resolutionNotes, status = ComplaintStatus.RESOLVED } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint record not found' });
    }

    complaint.status = status;
    complaint.resolutionNotes = resolutionNotes || 'Resolved by administrator';
    complaint.resolvedAt = new Date();
    complaint.resolvedBy = req.user._id;
    await complaint.save();

    await AuditLog.create({
      actorUserId: req.user._id,
      action: 'RESOLVE_COMPLAINT',
      resourceType: 'Complaint',
      resourceId: complaint._id.toString(),
      details: { resolutionNotes, status },
    });

    return res.status(200).json({
      success: true,
      message: 'Complaint marked as resolved',
      complaint,
    });
  } catch (error) {
    next(error);
  }
}

