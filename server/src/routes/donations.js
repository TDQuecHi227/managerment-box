const express = require('express');
const router = express.Router();
const {
  DonationSubmission,
  SystemSettings,
  User,
  getCurrentMonthString,
  getMonthRangeUTC7
} = require('../db');
const { authMiddleware } = require('../middleware/auth');

// POST /api/donations/submit - Thông báo chuyển đổi cách thức (Admin cập nhật thay vì Member tự submit)
router.post('/submit', authMiddleware, (req, res) => {
  return res.status(400).json({
    error: 'Đóng góp Donate hiện do Admin trực tiếp cập nhật lên hệ thống. Bạn chỉ cần chuyển khoản theo thông tin của Box và gửi ảnh minh chứng cho Admin để được cập nhật số tiền.'
  });
});

// GET /api/donations/my-history - Lịch sử đóng góp Donate của Member (do Admin ghi nhận)
router.get('/my-history', authMiddleware, async (req, res) => {
  try {
    const submissions = await DonationSubmission.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .lean();

    // Map reviewer name
    const reviewerIds = [...new Set(submissions.map((s) => s.reviewed_by).filter(Boolean))];
    const reviewers = await User.find({ id: { $in: reviewerIds } }).lean();
    const reviewerMap = {};
    reviewers.forEach((r) => { reviewerMap[r.id] = r.display_name; });

    const enriched = submissions.map((s) => ({
      ...s,
      reviewer_name: reviewerMap[s.reviewed_by] || null
    }));

    res.json({ submissions: enriched });
  } catch (err) {
    console.error('Error in /api/donations/my-history:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// GET /api/donations/my-summary - Tổng hợp đóng góp Donate của bản thân
router.get('/my-summary', authMiddleware, async (req, res) => {
  try {
    const currentMonth = getCurrentMonthString();
    const { start: monthStart, end: monthEnd } = getMonthRangeUTC7(currentMonth);

    // Tổng tiền đã duyệt trong tháng này
    const monthDonations = await DonationSubmission.find({
      user_id: req.user.id,
      status: 'APPROVED',
      created_at: { $gte: monthStart, $lte: monthEnd }
    }).lean();

    const approvedMonthTotal = monthDonations.reduce((sum, d) => sum + d.amount, 0);
    const approvedMonthCount = monthDonations.length;

    // Tổng tiền đã duyệt toàn thời gian
    const allDonations = await DonationSubmission.find({
      user_id: req.user.id,
      status: 'APPROVED'
    }).lean();

    const approvedAllTimeTotal = allDonations.reduce((sum, d) => sum + d.amount, 0);
    const approvedAllTimeCount = allDonations.length;

    // Thông tin ngân hàng của box
    const bankInfo = (await SystemSettings.findOne({ id: 1 }).lean()) || {
      bank_name: 'MB Bank (Quân Đội)',
      bank_account_number: '999988887777',
      bank_account_holder: 'NGUYEN VAN ADMIN',
      qr_code_note: 'DONATE BOX CHAT'
    };

    res.json({
      month: currentMonth,
      monthlyApprovedTotal: approvedMonthTotal,
      monthlyApprovedCount: approvedMonthCount,
      allTimeApprovedTotal: approvedAllTimeTotal,
      allTimeApprovedCount: approvedAllTimeCount,
      pendingCount: 0,
      pendingAmount: 0,
      bankInfo,
      notice: 'Khoản đóng góp được Admin ghi nhận trực tiếp kèm ảnh minh chứng.'
    });
  } catch (err) {
    console.error('Error in /api/donations/my-summary:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// GET /api/donations/public-fund - Bảng sao kê minh bạch quỹ Box Chat cho toàn thể thành viên
router.get('/public-fund', authMiddleware, async (req, res) => {
  try {
    const currentMonth = getCurrentMonthString();
    const { start: monthStart, end: monthEnd } = getMonthRangeUTC7(currentMonth);

    const donations = await DonationSubmission.find({ status: 'APPROVED' })
      .sort({ created_at: -1 })
      .lean();

    const userIds = [...new Set(donations.map((d) => d.user_id))];
    const reviewerIds = [...new Set(donations.map((d) => d.reviewed_by).filter(Boolean))];
    const users = await User.find({ id: { $in: [...userIds, ...reviewerIds] } }).lean();

    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u; });

    const enriched = donations.map((d) => ({
      ...d,
      display_name: userMap[d.user_id]?.display_name || '—',
      game_name: userMap[d.user_id]?.game_name || null,
      username: userMap[d.user_id]?.username || '—',
      reviewer_name: userMap[d.reviewed_by]?.display_name || null
    }));

    const monthlyTotal = donations
      .filter((d) => new Date(d.created_at) >= monthStart && new Date(d.created_at) <= monthEnd)
      .reduce((sum, d) => sum + d.amount, 0);

    const allTimeTotal = donations.reduce((sum, d) => sum + d.amount, 0);

    const bankInfo = (await SystemSettings.findOne({ id: 1 }).lean()) || {
      bank_name: 'MB Bank (Quân Đội)',
      bank_account_number: '999988887777',
      bank_account_holder: 'NGUYEN VAN ADMIN',
      qr_code_note: 'DONATE BOX CHAT'
    };

    res.json({
      month: currentMonth,
      monthlyTotal,
      allTimeTotal,
      bankInfo,
      donations: enriched
    });
  } catch (err) {
    console.error('Error in /api/donations/public-fund:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

module.exports = router;
