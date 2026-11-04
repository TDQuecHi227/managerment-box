const express = require('express');
const router = express.Router();
const {
  CloneSubmission,
  KpiPeriod,
  DonationRecipient,
  getNextSequence,
  getOrCreateCurrentPeriod,
  getCurrentMonthString,
  getMonthRangeUTC7,
  logAudit
} = require('../db');
const { authMiddleware, requireCloneMember } = require('../middleware/auth');

// POST /api/clones/submit - Member nộp danh sách Clone
router.post('/submit', authMiddleware, requireCloneMember, async (req, res) => {
  try {
    const { declared_count, raw_note } = req.body;
    const count = parseInt(declared_count, 10);

    if (!count || count <= 0) {
      return res.status(400).json({ error: 'Số lượng tài khoản nộp phải là số nguyên dương lớn hơn 0.' });
    }

    if (!raw_note || !raw_note.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập danh sách hoặc ghi chú tài khoản Clone (vd: baowibu01-10).' });
    }

    const currentPeriod = await getOrCreateCurrentPeriod();
    const nextId = await getNextSequence('clone_submissions');

    const created = await CloneSubmission.create({
      id: nextId,
      user_id: req.user.id,
      period_id: currentPeriod.id,
      declared_count: count,
      approved_count: 0,
      raw_note: raw_note.trim(),
      status: 'PENDING'
    });

    await logAudit(req.user.id, 'SUBMIT_CLONE', 'CLONE_SUBMISSION', nextId, {
      declared_count: count,
      raw_note: raw_note.trim()
    });

    return res.status(201).json({
      message: 'Gửi danh sách Clone thành công. Yêu cầu đang chờ Admin kiểm duyệt.',
      submission: created
    });
  } catch (err) {
    console.error('Error in /api/clones/submit:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// GET /api/clones/my-history - Lịch sử nộp của Member Clone
router.get('/my-history', authMiddleware, async (req, res) => {
  try {
    const submissions = await CloneSubmission.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .lean();

    res.json({ submissions });
  } catch (err) {
    console.error('Error in /api/clones/my-history:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// GET /api/clones/my-summary - Dashboard tóm tắt KPI tuần & Clone vượt tháng của Member Clone
router.get('/my-summary', authMiddleware, async (req, res) => {
  try {
    const currentPeriod = await getOrCreateCurrentPeriod();
    const currentMonth = getCurrentMonthString();
    const { start: monthStart, end: monthEnd } = getMonthRangeUTC7(currentMonth);

    // KPI tuần hiện tại
    const weekSubmissions = await CloneSubmission.find({
      user_id: req.user.id,
      period_id: currentPeriod.id
    }).lean();

    let approved = 0;
    let pending = 0;
    let rejected = 0;

    weekSubmissions.forEach((s) => {
      if (['APPROVED', 'PARTIALLY_APPROVED'].includes(s.status)) {
        approved += s.approved_count || 0;
      } else if (s.status === 'PENDING') {
        pending += s.declared_count || 0;
      } else if (s.status === 'REJECTED') {
        rejected += s.declared_count || 0;
      }
    });

    const targetValue = currentPeriod.target_value || 21;
    let kpiStatus = 'IN_PROGRESS';
    if (approved >= targetValue) {
      kpiStatus = 'ACHIEVED';
    } else if (currentPeriod.is_closed) {
      kpiStatus = 'MISSED';
    }

    // Kiểm tra tư cách chỉ định nhận Donate trong tháng
    const recipientRecord = await DonationRecipient.findOne({
      user_id: req.user.id,
      month: currentMonth,
      is_active: true
    }).lean();

    let recipientSummary = null;
    if (recipientRecord) {
      const monthSubs = await CloneSubmission.find({
        user_id: req.user.id,
        status: { $in: ['APPROVED', 'PARTIALLY_APPROVED'] },
        created_at: { $gte: monthStart, $lte: monthEnd }
      }).lean();

      const monthlyApproved = monthSubs.reduce((sum, s) => sum + (s.approved_count || 0), 0);
      const baseline = 100;
      const excessClones = Math.max(0, monthlyApproved - baseline);

      recipientSummary = {
        isRecipient: true,
        month: currentMonth,
        monthlyApproved,
        baseline,
        excessClones,
        canReceiveDonation: excessClones > 0
      };
    }

    res.json({
      period: {
        code: currentPeriod.code,
        target: targetValue,
        approved,
        pending,
        rejected,
        status: kpiStatus
      },
      recipientSummary
    });
  } catch (err) {
    console.error('Error in /api/clones/my-summary:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

module.exports = router;
