const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const { uploadToCloudinary, removeVietnameseTones } = require('../utils/cloudinary');
const {
  User,
  KpiPeriod,
  CloneList,
  CloneSubmission,
  DonationSubmission,
  DonationRecipient,
  ViolationAction,
  ArenaDistribution,
  SystemSettings,
  AuditLog,
  getNextSequence,
  getCurrentMonthString,
  getTodayString,
  getTodayRangeUTC7,
  getMonthRangeUTC7,
  getOrCreateCurrentPeriod,
  logAudit
} = require('../db');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Tất cả route trong file này yêu cầu quyền Admin
router.use(authMiddleware, requireAdmin);

// =========================================================================
// GET /api/admin/dashboard - Thống kê tổng quan hệ thống
// =========================================================================
router.get('/dashboard', async (req, res) => {
  try {
    const currentPeriod = await getOrCreateCurrentPeriod();
    const currentMonth = getCurrentMonthString();
    const todayStr = getTodayString();
    const { start: todayStart, end: todayEnd } = getTodayRangeUTC7(todayStr);
    const { start: monthStart, end: monthEnd } = getMonthRangeUTC7(currentMonth);

    const dailyTarget = 3;
    const weeklyTarget = 21;

    // 1. Thống kê thành viên
    const totalMembers = await User.countDocuments({ system_role: 'MEMBER' });
    const activeMembers = await User.countDocuments({ system_role: 'MEMBER', status: 'ACTIVE' });
    const totalCloneMembers = await User.countDocuments({
      system_role: 'MEMBER',
      status: 'ACTIVE',
      contribution_type: 'CLONE'
    });
    const totalDonateMembers = await User.countDocuments({
      system_role: 'MEMBER',
      status: 'ACTIVE',
      contribution_type: 'DONATE'
    });

    // 2. Thành viên Cày Clone active và tiến độ hôm nay & tuần
    const cloneUsers = await User.find({
      system_role: 'MEMBER',
      status: 'ACTIVE',
      contribution_type: 'CLONE'
    }).lean();

    const cloneUserIds = cloneUsers.map((u) => u.id);

    // Submissions hôm nay
    const todaySubmissions = await CloneSubmission.find({
      user_id: { $in: cloneUserIds },
      created_at: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    // Submissions tuần này
    const weekSubmissions = await CloneSubmission.find({
      user_id: { $in: cloneUserIds },
      period_id: currentPeriod.id
    }).lean();

    const memberKPIProgress = cloneUsers.map((u) => {
      const todayCount = todaySubmissions
        .filter((s) => s.user_id === u.id)
        .reduce((sum, s) => sum + (s.declared_count || 0), 0);

      const weekApprovedCount = weekSubmissions
        .filter((s) => s.user_id === u.id)
        .reduce((sum, s) => sum + (s.declared_count || 0), 0);

      return {
        id: u.id,
        display_name: u.display_name,
        game_name: u.game_name,
        username: u.username,
        contribution_type: 'CLONE',
        today_count: todayCount,
        week_approved_count: weekApprovedCount
      };
    });

    memberKPIProgress.sort((a, b) => a.today_count - b.today_count || a.week_approved_count - b.week_approved_count);

    const unsubmittedTodayCount = memberKPIProgress.filter((m) => m.today_count === 0).length;
    const achievedTodayCount = memberKPIProgress.filter((m) => m.today_count >= dailyTarget).length;
    const achievedWeekCount = memberKPIProgress.filter((m) => m.week_approved_count >= weeklyTarget).length;

    // 3. Quỹ Donate
    const approvedDonations = await DonationSubmission.find({ status: 'APPROVED' }).lean();

    const monthlyDonate = approvedDonations
      .filter((d) => new Date(d.created_at) >= monthStart && new Date(d.created_at) <= monthEnd)
      .reduce((sum, d) => sum + d.amount, 0);

    const allTimeDonate = approvedDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalDonationCount = approvedDonations.length;

    // 4. Clone đấu trường
    const allCloneSubs = await CloneSubmission.find({}).lean();
    const totalApprovedClones = allCloneSubs.reduce((sum, s) => sum + (s.declared_count || 0), 0);
    const unclimbedClones = allCloneSubs
      .filter((s) => s.arena_status === 'NOT_CLIMBED' || !s.arena_status)
      .reduce((sum, s) => sum + (s.declared_count || 0), 0);
    const climbedClones = allCloneSubs
      .filter((s) => s.arena_status === 'CLIMBED')
      .reduce((sum, s) => sum + (s.declared_count || 0), 0);

    // 5. Clone Lists gần đây
    const allUsers = await User.find({}).lean();
    const userMap = {};
    allUsers.forEach((u) => { userMap[u.id] = u; });

    const rawLists = await CloneList.find({})
      .sort({ updated_at: -1, id: -1 })
      .limit(10)
      .lean();

    const cloneLists = rawLists.map((cl) => {
      const todayAdded = todaySubmissions
        .filter((s) => s.list_id === cl.id)
        .reduce((sum, s) => sum + (s.declared_count || 0), 0);

      const u = userMap[cl.user_id];
      return {
        ...cl,
        username: u?.username || '—',
        display_name: u?.display_name || '—',
        game_name: u?.game_name || null,
        today_added_count: todayAdded
      };
    });

    // 6. Recent Submissions & Recent Donations
    const recentSubsRaw = await CloneSubmission.find({})
      .sort({ created_at: -1 })
      .limit(6)
      .lean();

    const periodsRaw = await KpiPeriod.find({}).lean();
    const periodMap = {};
    periodsRaw.forEach((p) => { periodMap[p.id] = p.code; });

    const recentSubmissions = recentSubsRaw.map((s) => {
      const u = userMap[s.user_id];
      return {
        ...s,
        username: u?.username || '—',
        display_name: u?.display_name || '—',
        game_name: u?.game_name || null,
        period_code: periodMap[s.period_id] || ''
      };
    });

    const recentDonationsRaw = await DonationSubmission.find({ status: 'APPROVED' })
      .sort({ created_at: -1 })
      .limit(6)
      .lean();

    const recentDonations = recentDonationsRaw.map((d) => {
      const u = userMap[d.user_id];
      return {
        ...d,
        username: u?.username || '—',
        display_name: u?.display_name || '—',
        game_name: u?.game_name || null
      };
    });

    res.json({
      members: {
        total: totalMembers,
        active: activeMembers,
        clone: totalCloneMembers,
        donate: totalDonateMembers
      },
      today: {
        date: todayStr,
        target: dailyTarget,
        unsubmittedCount: unsubmittedTodayCount,
        achievedCount: achievedTodayCount
      },
      arena: {
        unclimbedClones,
        climbedClones,
        totalApprovedClones
      },
      kpi: {
        periodCode: currentPeriod.code,
        target: weeklyTarget,
        dailyTarget: dailyTarget,
        totalCloneMembers: totalCloneMembers,
        achievedMembers: achievedWeekCount,
        unsubmittedToday: unsubmittedTodayCount
      },
      donations: {
        month: currentMonth,
        monthlyConfirmedTotal: monthlyDonate,
        allTimeConfirmedTotal: allTimeDonate,
        totalCount: totalDonationCount
      },
      unclimbedSubmissions: recentSubmissions.filter((s) => s.arena_status === 'NOT_CLIMBED'),
      recentSubmissions,
      cloneLists,
      memberKPIProgress,
      recentDonations
    });
  } catch (err) {
    console.error('Error in /api/admin/dashboard:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// GET /api/admin/clones/queue - Danh sách tất cả Clone đã nhập
// =========================================================================
router.get('/clones/queue', async (req, res) => {
  try {
    const { arena_status } = req.query;
    const filter = {};
    if (arena_status && arena_status !== 'ALL') {
      filter.arena_status = arena_status;
    }

    const list = await CloneSubmission.find(filter)
      .sort({ created_at: -1 })
      .lean();

    const allUsers = await User.find({}).lean();
    const userMap = {};
    allUsers.forEach((u) => { userMap[u.id] = u; });

    const periodsRaw = await KpiPeriod.find({}).lean();
    const periodMap = {};
    periodsRaw.forEach((p) => { periodMap[p.id] = p.code; });

    const submissions = list.map((s) => {
      const u = userMap[s.user_id];
      return {
        ...s,
        username: u?.username || '—',
        display_name: u?.display_name || '—',
        game_name: u?.game_name || null,
        period_code: periodMap[s.period_id] || ''
      };
    });

    res.json({ submissions });
  } catch (err) {
    console.error('Error in /api/admin/clones/queue:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// POST /api/admin/clones/:id/toggle-arena - Đổi trạng thái leo Đấu Trường
// =========================================================================
router.post('/clones/:id/toggle-arena', async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id, 10);
    const submission = await CloneSubmission.findOne({ id: submissionId });
    if (!submission) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu nộp Clone.' });
    }

    const { arena_status } = req.body || {};
    let newStatus;
    if (arena_status && ['NOT_CLIMBED', 'CLIMBED'].includes(arena_status)) {
      newStatus = arena_status;
    } else {
      newStatus = submission.arena_status === 'CLIMBED' ? 'NOT_CLIMBED' : 'CLIMBED';
    }

    submission.arena_status = newStatus;
    await submission.save();

    await logAudit(req.user.id, 'TOGGLE_ARENA_STATUS', 'CLONE_SUBMISSION', submissionId, {
      old_status: submission.arena_status,
      new_status: newStatus
    });

    const user = await User.findOne({ id: submission.user_id }).lean();
    const period = await KpiPeriod.findOne({ id: submission.period_id }).lean();

    res.json({
      message: newStatus === 'CLIMBED' ? 'Đã đánh dấu: Đã leo đấu trường' : 'Đã đánh dấu: Chưa leo đấu trường',
      submission: {
        ...submission.toObject(),
        username: user?.username || '—',
        display_name: user?.display_name || '—',
        game_name: user?.game_name || null,
        period_code: period?.code || ''
      }
    });
  } catch (err) {
    console.error('Error in /api/admin/clones/:id/toggle-arena:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// GET /api/admin/clones/monthly-history - Lịch sử cày Clone của thành viên trong 1 tháng
// =========================================================================
router.get('/clones/monthly-history', async (req, res) => {
  try {
    const currentMonth = getCurrentMonthString();
    const selectedMonth = req.query.month || currentMonth;
    const { start: monthStart, end: monthEnd } = getMonthRangeUTC7(selectedMonth);

    // 1. Lấy danh sách các kỳ tuần liên quan tới tháng này
    const periodsInMonth = await KpiPeriod.find({
      $or: [
        { start_date: { $regex: `^${selectedMonth}` } },
        { end_date: { $regex: `^${selectedMonth}` } }
      ]
    })
      .sort({ start_date: 1 })
      .lean();

    // 2. Lấy danh sách các tháng có dữ liệu clone
    const allSubs = await CloneSubmission.find({}).lean();
    const availableMonthsSet = new Set([currentMonth]);
    allSubs.forEach((s) => {
      if (s.created_at) {
        const d = new Date(s.created_at);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        availableMonthsSet.add(`${y}-${m}`);
      }
    });
    const availableMonths = Array.from(availableMonthsSet).sort().reverse();

    // 3. Lấy danh sách thành viên CÀY CLONE active (thành viên Donate không cày acc)
    const members = await User.find({
      system_role: 'MEMBER',
      status: 'ACTIVE',
      contribution_type: 'CLONE'
    })
      .sort({ display_name: 1 })
      .lean();

    // 4. Lấy submissions trong tháng
    const periodIds = periodsInMonth.map((p) => p.id);
    const submissions = await CloneSubmission.find({
      status: { $in: ['APPROVED', 'PARTIALLY_APPROVED'] },
      $or: [
        { created_at: { $gte: monthStart, $lte: monthEnd } },
        { period_id: { $in: periodIds } }
      ]
    }).lean();

    // 5. Tổng hợp theo thành viên và theo từng tuần
    const memberHistory = members.map((m) => {
      const memberSubs = submissions.filter((s) => s.user_id === m.id);
      const totalMonthClones = memberSubs.reduce((sum, s) => sum + (s.approved_count || s.declared_count || 0), 0);
      const unclimbedMonthClones = memberSubs
        .filter((s) => s.arena_status === 'NOT_CLIMBED' || !s.arena_status)
        .reduce((sum, s) => sum + (s.approved_count || s.declared_count || 0), 0);
      const climbedMonthClones = memberSubs
        .filter((s) => s.arena_status === 'CLIMBED')
        .reduce((sum, s) => sum + (s.approved_count || s.declared_count || 0), 0);

      const weeklyBreakdown = periodsInMonth.map((p) => {
        const weekSubs = memberSubs.filter((s) => s.period_id === p.id);
        const weekCount = weekSubs.reduce((sum, s) => sum + (s.approved_count || s.declared_count || 0), 0);
        const target = p.target_value || 21;
        return {
          periodId: p.id,
          periodCode: p.code,
          startDate: p.start_date,
          endDate: p.end_date,
          target,
          count: weekCount,
          isAchieved: weekCount >= target
        };
      });

      return {
        id: m.id,
        username: m.username,
        display_name: m.display_name,
        game_name: m.game_name,
        contribution_type: 'CLONE',
        totalMonthClones,
        unclimbedMonthClones,
        climbedMonthClones,
        weeklyBreakdown
      };
    });

    memberHistory.sort((a, b) => b.totalMonthClones - a.totalMonthClones);
    const totalBoxClones = memberHistory.reduce((sum, m) => sum + m.totalMonthClones, 0);

    res.json({
      month: selectedMonth,
      availableMonths,
      periods: periodsInMonth,
      totalBoxClones,
      members: memberHistory
    });
  } catch (err) {
    console.error('Error in /api/admin/clones/monthly-history:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// GET /api/admin/clone-lists - Lấy danh sách List Clone
// =========================================================================
router.get('/clone-lists', async (req, res) => {
  try {
    const { user_id } = req.query;
    const filter = {};
    if (user_id) {
      filter.user_id = parseInt(user_id, 10);
    }

    const lists = await CloneList.find(filter)
      .sort({ updated_at: -1, id: -1 })
      .lean();

    const allUsers = await User.find({}).lean();
    const userMap = {};
    allUsers.forEach((u) => { userMap[u.id] = u; });

    const todayStr = getTodayString();
    const { start: todayStart, end: todayEnd } = getTodayRangeUTC7(todayStr);

    const listIds = lists.map((l) => l.id);
    const todaySubs = await CloneSubmission.find({
      list_id: { $in: listIds },
      created_at: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    const enriched = lists.map((cl) => {
      const u = userMap[cl.user_id];
      const todayAdded = todaySubs
        .filter((s) => s.list_id === cl.id)
        .reduce((sum, s) => sum + (s.declared_count || 0), 0);

      return {
        ...cl,
        username: u?.username || '—',
        display_name: u?.display_name || '—',
        game_name: u?.game_name || null,
        today_added_count: todayAdded
      };
    });

    res.json({
      total: enriched.length,
      lists: enriched
    });
  } catch (err) {
    console.error('Error in /api/admin/clone-lists:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// POST /api/admin/clone-lists - Thao tác 1: Tạo List Clone mới khi thành viên nộp list mới
// =========================================================================
router.post('/clone-lists', async (req, res) => {
  try {
    const {
      user_id,
      account_name,
      count,
      raw_note,
      submission_date
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Vui lòng chọn thành viên nộp Clone.' });
    }

    const member = await User.findOne({ id: parseInt(user_id, 10), system_role: 'MEMBER' });
    if (!member) {
      return res.status(404).json({ error: 'Không tìm thấy thành viên đã chọn.' });
    }

    const safePrefix = (member.game_name || member.display_name || 'acc').toLowerCase().replace(/\s+/g, '_');
    const accName = account_name && account_name.trim() ? account_name.trim() : `clone_${safePrefix}`;
    const parsedCount = parseInt(count, 10);
    if (!parsedCount || parsedCount <= 0) {
      return res.status(400).json({ error: 'Vui lòng nhập số lượng acc hợp lệ lớn hơn 0.' });
    }

    const note = raw_note && raw_note.trim() ? raw_note.trim() : `${accName} | ${parsedCount} acc`;
    const currentPeriod = await getOrCreateCurrentPeriod(submission_date);

    let createdAt = new Date();
    if (submission_date) {
      createdAt = new Date(`${submission_date}T12:00:00+07:00`);
    }

    const newListId = await getNextSequence('clone_lists');
    const createdList = await CloneList.create({
      id: newListId,
      user_id: member.id,
      account_name: accName,
      total_count: parsedCount,
      raw_note: note,
      arena_status: 'NOT_CLIMBED',
      created_at: createdAt,
      updated_at: createdAt
    });

    // Ghi nhận lượt nộp trong clone_submissions (tính vào KPI hôm nay & tuần)
    const newSubId = await getNextSequence('clone_submissions');
    await CloneSubmission.create({
      id: newSubId,
      user_id: member.id,
      list_id: newListId,
      period_id: currentPeriod.id,
      declared_count: parsedCount,
      approved_count: parsedCount,
      account_prefix: accName,
      raw_note: note,
      status: 'APPROVED',
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      arena_status: 'NOT_CLIMBED',
      created_at: createdAt
    });

    await logAudit(req.user.id, 'CREATE_CLONE_LIST', 'CLONE_LIST', newListId, {
      user_id: member.id,
      account_name: accName,
      count: parsedCount,
      note
    });

    res.status(201).json({
      message: `Đã tạo list clone mới "${accName}" (${parsedCount} acc) cho ${member.display_name}`,
      list: {
        ...createdList.toObject(),
        username: member.username,
        display_name: member.display_name,
        game_name: member.game_name
      }
    });
  } catch (err) {
    console.error('Error in POST /api/admin/clone-lists:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// POST /api/admin/clone-lists/:id/add-clones - Thao tác 2: Cập nhật nộp thêm clone vào list
// =========================================================================
router.post('/clone-lists/:id/add-clones', async (req, res) => {
  try {
    const listId = parseInt(req.params.id, 10);
    const list = await CloneList.findOne({ id: listId });
    if (!list) {
      return res.status(404).json({ error: 'Không tìm thấy List Clone này.' });
    }

    const { count, raw_note, submission_date } = req.body;
    const addedCount = parseInt(count, 10);
    if (!addedCount || addedCount <= 0) {
      return res.status(400).json({ error: 'Số lượng Clone nộp thêm phải là số lớn hơn 0.' });
    }

    const currentPeriod = await getOrCreateCurrentPeriod(submission_date);

    let createdAt = new Date();
    if (submission_date) {
      createdAt = new Date(`${submission_date}T12:00:00+07:00`);
    }

    // 1. Cập nhật tổng số clone và ghi chú của List
    list.total_count = (list.total_count || 0) + addedCount;
    if (raw_note && raw_note.trim()) {
      list.raw_note = raw_note.trim();
    }
    list.updated_at = new Date();
    await list.save();

    // 2. Tạo bản ghi lượt nộp mới trong clone_submissions (tính vào KPI hôm nay & tuần)
    const newSubId = await getNextSequence('clone_submissions');
    await CloneSubmission.create({
      id: newSubId,
      user_id: list.user_id,
      list_id: list.id,
      period_id: currentPeriod.id,
      declared_count: addedCount,
      approved_count: addedCount,
      account_prefix: list.account_name,
      raw_note: raw_note && raw_note.trim() ? raw_note.trim() : `Nộp thêm +${addedCount} acc vào list ${list.account_name}`,
      status: 'APPROVED',
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      arena_status: 'NOT_CLIMBED',
      created_at: createdAt
    });

    await logAudit(req.user.id, 'ADD_CLONES_TO_LIST', 'CLONE_LIST', list.id, {
      added_count: addedCount,
      new_total_count: list.total_count,
      submission_id: newSubId
    });

    const member = await User.findOne({ id: list.user_id }).lean();

    res.json({
      message: `Đã nộp thêm ${addedCount} clone vào list "${list.account_name}" (Tổng hiện tại: ${list.total_count} acc)`,
      list: {
        ...list.toObject(),
        username: member?.username || '—',
        display_name: member?.display_name || '—',
        game_name: member?.game_name || null
      }
    });
  } catch (err) {
    console.error('Error in /api/admin/clone-lists/:id/add-clones:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// PUT /api/admin/clone-lists/:id - Sửa thông tin List Clone
// =========================================================================
router.put('/clone-lists/:id', async (req, res) => {
  try {
    const listId = parseInt(req.params.id, 10);
    const list = await CloneList.findOne({ id: listId });
    if (!list) {
      return res.status(404).json({ error: 'Không tìm thấy List Clone.' });
    }

    const { account_name, total_count, raw_note } = req.body;
    if (account_name && account_name.trim()) {
      list.account_name = account_name.trim();
    }
    if (total_count !== undefined) {
      list.total_count = parseInt(total_count, 10) || 0;
    }
    if (raw_note !== undefined) {
      list.raw_note = raw_note.trim();
    }
    list.updated_at = new Date();
    await list.save();

    await logAudit(req.user.id, 'UPDATE_CLONE_LIST', 'CLONE_LIST', listId, req.body);

    const member = await User.findOne({ id: list.user_id }).lean();

    res.json({
      message: 'Cập nhật thông tin List Clone thành công',
      list: {
        ...list.toObject(),
        username: member?.username || '—',
        display_name: member?.display_name || '—',
        game_name: member?.game_name || null
      }
    });
  } catch (err) {
    console.error('Error in PUT /api/admin/clone-lists/:id:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// DELETE /api/admin/clone-lists/:id - Xóa List Clone
// =========================================================================
router.delete('/clone-lists/:id', async (req, res) => {
  try {
    const listId = parseInt(req.params.id, 10);
    const list = await CloneList.findOne({ id: listId });
    if (!list) {
      return res.status(404).json({ error: 'Không tìm thấy List Clone.' });
    }

    await CloneSubmission.deleteMany({ list_id: listId });
    await CloneList.deleteOne({ id: listId });

    await logAudit(req.user.id, 'DELETE_CLONE_LIST', 'CLONE_LIST', listId, {
      account_name: list.account_name
    });

    res.json({ message: `Đã xóa List Clone "${list.account_name}" và các lượt nộp liên quan.` });
  } catch (err) {
    console.error('Error in DELETE /api/admin/clone-lists/:id:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// POST /api/admin/clones - Nhập Clone trực tiếp
// =========================================================================
router.post('/clones', async (req, res) => {
  try {
    const {
      user_id,
      count,
      raw_note,
      submission_date,
      arena_status,
      account_prefix
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Vui lòng chọn thành viên nộp Clone.' });
    }

    const member = await User.findOne({ id: parseInt(user_id, 10), system_role: 'MEMBER' });
    if (!member) {
      return res.status(404).json({ error: 'Không tìm thấy thành viên đã chọn.' });
    }

    const parsedCount = parseInt(count, 10);
    if (!parsedCount || parsedCount <= 0) {
      return res.status(400).json({ error: 'Vui lòng nhập số lượng tài khoản hợp lệ lớn hơn 0.' });
    }

    const currentPeriod = await getOrCreateCurrentPeriod(submission_date);

    let createdAt = new Date();
    if (submission_date) {
      createdAt = new Date(`${submission_date}T12:00:00+07:00`);
    }

    const note = raw_note && raw_note.trim() ? raw_note.trim() : `${account_prefix || 'clone'} | ${parsedCount} acc`;

    const nextSubId = await getNextSequence('clone_submissions');
    const created = await CloneSubmission.create({
      id: nextSubId,
      user_id: member.id,
      period_id: currentPeriod.id,
      declared_count: parsedCount,
      approved_count: parsedCount,
      account_prefix: account_prefix || `clone_${(member.game_name || member.display_name || 'acc').toLowerCase().replace(/\s+/g, '_')}`,
      raw_note: note,
      status: 'APPROVED',
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      arena_status: arena_status || 'NOT_CLIMBED',
      created_at: createdAt
    });

    await logAudit(req.user.id, 'ADMIN_RECORD_CLONE', 'CLONE_SUBMISSION', nextSubId, {
      user_id: member.id,
      count: parsedCount,
      note
    });

    res.status(201).json({
      message: `Đã ghi nhận ${parsedCount} Clone cho ${member.display_name}`,
      submission: created
    });
  } catch (err) {
    console.error('Error in POST /api/admin/clones:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// PUT & DELETE /api/admin/clones/:id
// =========================================================================
router.put('/clones/:id', async (req, res) => {
  try {
    const subId = parseInt(req.params.id, 10);
    const sub = await CloneSubmission.findOne({ id: subId });
    if (!sub) {
      return res.status(404).json({ error: 'Không tìm thấy bản ghi Clone.' });
    }

    const { count, raw_note, arena_status, submission_date } = req.body;
    if (count !== undefined) {
      const parsed = parseInt(count, 10);
      sub.declared_count = parsed;
      sub.approved_count = parsed;
    }
    if (raw_note !== undefined) sub.raw_note = raw_note.trim();
    if (arena_status !== undefined) sub.arena_status = arena_status;
    if (submission_date) {
      sub.created_at = new Date(`${submission_date}T12:00:00+07:00`);
    }

    await sub.save();
    await logAudit(req.user.id, 'UPDATE_CLONE_SUBMISSION', 'CLONE_SUBMISSION', subId, req.body);

    res.json({ message: 'Cập nhật thành công', submission: sub });
  } catch (err) {
    console.error('Error in PUT /api/admin/clones/:id:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

router.delete('/clones/:id', async (req, res) => {
  try {
    const subId = parseInt(req.params.id, 10);
    await CloneSubmission.deleteOne({ id: subId });
    await logAudit(req.user.id, 'DELETE_CLONE_SUBMISSION', 'CLONE_SUBMISSION', subId, {});
    res.json({ message: 'Đã xóa lượt nộp Clone này.' });
  } catch (err) {
    console.error('Error in DELETE /api/admin/clones/:id:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// ROUTE NHÓM LEO ĐẤU TRƯỜNG & PHÁT LÌ XÌ CLONE THEO NGÀY
// =========================================================================

// 1. GET /api/admin/arena - Lấy toàn bộ thông tin Đấu trường & Phát lì xì
router.get('/arena', async (req, res) => {
  try {
    const allUsers = await User.find({}).lean();
    const userMap = {};
    allUsers.forEach((u) => { userMap[u.id] = u; });

    const allLists = await CloneList.find({}).sort({ unclimbed_count: -1, id: -1 }).lean();

    const totalClimbed = allLists.reduce((sum, l) => sum + (l.climbed_count || 0), 0);
    const totalUnclimbed = allLists.reduce((sum, l) => {
      const unc = l.unclimbed_count !== undefined ? l.unclimbed_count : Math.max(0, (l.total_count || 0) - (l.climbed_count || 0));
      return sum + unc;
    }, 0);

    const enrichedLists = allLists.map((l) => {
      const u = userMap[l.user_id];
      const unc = l.unclimbed_count !== undefined ? l.unclimbed_count : Math.max(0, (l.total_count || 0) - (l.climbed_count || 0));
      return {
        ...l,
        display_name: u?.display_name || '—',
        game_name: u?.game_name || null,
        unclimbed_count: unc,
        climbed_count: l.climbed_count || 0
      };
    });

    const distributions = await ArenaDistribution.find({})
      .sort({ distribution_date: -1, id: -1 })
      .lean();

    const totalDistributed = distributions.reduce((sum, d) => sum + (d.count || 0), 0);

    res.json({
      stats: {
        total_climbed: totalClimbed,
        total_unclimbed: totalUnclimbed,
        total_distributed: totalDistributed,
        total_lists: allLists.length
      },
      unclimbed_lists: enrichedLists,
      distributions
    });
  } catch (err) {
    console.error('Error in GET /api/admin/arena:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// 2. PUT /api/admin/arena/clone-lists/:id - Cập nhật số acc chưa leo và ghi chú chưa leo
router.put('/arena/clone-lists/:id', async (req, res) => {
  try {
    const listId = parseInt(req.params.id, 10);
    const list = await CloneList.findOne({ id: listId });
    if (!list) {
      return res.status(404).json({ error: 'Không tìm thấy List Clone.' });
    }

    const { unclimbed_count, raw_note, climbed_count } = req.body;

    if (unclimbed_count !== undefined && unclimbed_count !== null) {
      const newUnc = Math.max(0, parseInt(unclimbed_count, 10) || 0);
      list.unclimbed_count = newUnc;
    }

    if (raw_note !== undefined) {
      list.raw_note = raw_note.trim();
    }

    if (climbed_count !== undefined && climbed_count !== null) {
      list.climbed_count = Math.max(0, parseInt(climbed_count, 10) || 0);
    }

    // Tự động đồng bộ arena_status
    if (list.unclimbed_count === 0 && (list.climbed_count || 0) > 0) {
      list.arena_status = 'CLIMBED';
    } else if ((list.climbed_count || 0) > 0 && list.unclimbed_count > 0) {
      list.arena_status = 'PARTIALLY_CLIMBED';
    } else {
      list.arena_status = 'NOT_CLIMBED';
    }

    list.updated_at = new Date();
    await list.save();

    await logAudit(req.user.id, 'UPDATE_ARENA_UNCLIMBED', 'CLONE_LIST', listId, {
      unclimbed_count: list.unclimbed_count,
      climbed_count: list.climbed_count,
      raw_note: list.raw_note
    });

    const user = await User.findOne({ id: list.user_id }).lean();

    res.json({
      message: 'Cập nhật ghi chú và số acc chưa leo thành công',
      list: {
        ...list.toObject(),
        display_name: user?.display_name || '—',
        game_name: user?.game_name || null
      }
    });
  } catch (err) {
    console.error('Error in PUT /api/admin/arena/clone-lists/:id:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// 3. POST /api/admin/arena/distributions - Tạo đợt phát lì xì clone theo ngày
router.post('/arena/distributions', async (req, res) => {
  try {
    const { distribution_date, list_id, account_name, count, note, deduct_from_list } = req.body;

    if (!distribution_date) {
      return res.status(400).json({ error: 'Vui lòng chọn ngày phát lì xì.' });
    }

    const numCount = parseInt(count, 10);
    if (!numCount || numCount <= 0) {
      return res.status(400).json({ error: 'Số lượng acc phát lì xì phải lớn hơn 0.' });
    }

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập danh sách acc / mật khẩu phát lì xì.' });
    }

    let finalAccountName = (account_name || '').trim();

    // Nếu có list_id, xử lý trừ số lượng chưa leo của list
    if (list_id) {
      const list = await CloneList.findOne({ id: parseInt(list_id, 10) });
      if (list) {
        finalAccountName = finalAccountName || list.account_name;
        if (deduct_from_list !== false) {
          const currentUnc = list.unclimbed_count !== undefined
            ? list.unclimbed_count
            : Math.max(0, (list.total_count || 0) - (list.climbed_count || 0));
          list.unclimbed_count = Math.max(0, currentUnc - numCount);
          list.climbed_count = (list.climbed_count || 0) + numCount;
          
          if (list.unclimbed_count === 0) {
            list.arena_status = 'CLIMBED';
          } else {
            list.arena_status = 'PARTIALLY_CLIMBED';
          }

          const entryText = `[Ngày ${distribution_date}] (${numCount} acc lì xì): ${note.trim()}`;
          list.climbed_note = list.climbed_note ? `${list.climbed_note}\n${entryText}` : entryText;

          list.updated_at = new Date();
          await list.save();
        }
      }
    }

    const nextId = await getNextSequence('arena_distributions');
    const created = await ArenaDistribution.create({
      id: nextId,
      distribution_date,
      list_id: list_id ? parseInt(list_id, 10) : null,
      account_name: finalAccountName,
      count: numCount,
      note: note.trim(),
      created_by: req.user.id,
      created_at: new Date()
    });

    await logAudit(req.user.id, 'CREATE_ARENA_DISTRIBUTION', 'ARENA_DISTRIBUTION', nextId, {
      distribution_date,
      count: numCount,
      account_name: finalAccountName
    });

    res.json({
      message: `Đã tạo đợt phát lì xì ngày ${distribution_date} (${numCount} acc)`,
      distribution: created
    });
  } catch (err) {
    console.error('Error in POST /api/admin/arena/distributions:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// 4. PUT /api/admin/arena/distributions/:id - Sửa đợt phát lì xì
router.put('/arena/distributions/:id', async (req, res) => {
  try {
    const distId = parseInt(req.params.id, 10);
    const dist = await ArenaDistribution.findOne({ id: distId });
    if (!dist) {
      return res.status(404).json({ error: 'Không tìm thấy đợt phát lì xì này.' });
    }

    const { distribution_date, account_name, count, note } = req.body;
    if (distribution_date) dist.distribution_date = distribution_date;
    if (account_name !== undefined) dist.account_name = account_name.trim();
    if (count !== undefined) {
      const num = parseInt(count, 10);
      if (num > 0) dist.count = num;
    }
    if (note !== undefined && note.trim()) dist.note = note.trim();
    dist.updated_at = new Date();
    await dist.save();

    await logAudit(req.user.id, 'UPDATE_ARENA_DISTRIBUTION', 'ARENA_DISTRIBUTION', distId, req.body);

    res.json({ message: 'Cập nhật đợt phát lì xì thành công', distribution: dist });
  } catch (err) {
    console.error('Error in PUT /api/admin/arena/distributions/:id:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// 5. DELETE /api/admin/arena/distributions/:id - Xóa đợt phát lì xì
router.delete('/arena/distributions/:id', async (req, res) => {
  try {
    const distId = parseInt(req.params.id, 10);
    await ArenaDistribution.deleteOne({ id: distId });
    await logAudit(req.user.id, 'DELETE_ARENA_DISTRIBUTION', 'ARENA_DISTRIBUTION', distId, {});
    res.json({ message: 'Đã xóa đợt phát lì xì này.' });
  } catch (err) {
    console.error('Error in DELETE /api/admin/arena/distributions/:id:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// POST /api/admin/donations - Cập nhật khoản Donate mới (kèm ảnh minh chứng)
// =========================================================================
router.post('/donations', upload.single('proof'), async (req, res) => {
  try {
    const { user_id, amount, note, donation_date } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Vui lòng chọn thành viên đóng góp.' });
    }

    const member = await User.findOne({ id: parseInt(user_id, 10), system_role: 'MEMBER' });
    if (!member) {
      return res.status(404).json({ error: 'Không tìm thấy thành viên đã chọn.' });
    }

    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Số tiền đóng góp phải là số nguyên dương lớn hơn 0.' });
    }

    let createdAt = new Date();
    if (donation_date) {
      createdAt = new Date(`${donation_date}T12:00:00+07:00`);
    }

    // Tên ảnh: Tên thành viên + tháng donate (Ví dụ: bao_wibu_thang_11_2026_...)
    const targetDate = donation_date ? new Date(`${donation_date}T12:00:00+07:00`) : new Date(Date.now() + 7 * 3600 * 1000);
    const monthNum = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    const yearNum = targetDate.getUTCFullYear();
    const monthStr = `thang_${monthNum}_${yearNum}`;

    let proofImagePath = null;
    if (req.file) {
      const memberCleanName = removeVietnameseTones(member.display_name || member.game_name || 'member');
      const publicId = `${memberCleanName}_${monthStr}_${Date.now()}`;

      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        console.log(`Uploading donation proof to Cloudinary: caisbang_donations/${publicId}...`);
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'caisbang_donations',
          public_id: publicId
        });
        proofImagePath = uploadResult.secure_url;
        console.log('Cloudinary upload success:', proofImagePath);
      } else {
        // Fallback lưu local nếu chưa cấu hình Cloudinary credentials
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const ext = path.extname(req.file.originalname || '.jpg') || '.jpg';
        const localFileName = `${publicId}${ext}`;
        fs.writeFileSync(path.join(uploadsDir, localFileName), req.file.buffer);
        proofImagePath = localFileName;
      }
    }

    const nextDonationId = await getNextSequence('donation_submissions');
    const created = await DonationSubmission.create({
      id: nextDonationId,
      user_id: member.id,
      amount: numAmount,
      proof_image_path: proofImagePath,
      status: 'APPROVED',
      note: note && note.trim() ? note.trim() : 'Ủng hộ quỹ Cái Bang',
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      created_at: createdAt
    });

    await logAudit(req.user.id, 'ADMIN_RECORD_DONATION', 'DONATION_SUBMISSION', nextDonationId, {
      user_id: member.id,
      amount: numAmount,
      proof: proofImagePath
    });

    res.status(201).json({
      message: `Đã ghi nhận ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numAmount)} từ ${member.display_name}`,
      donation: created
    });
  } catch (err) {
    console.error('Error in POST /api/admin/donations:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// GET /api/admin/donations - Lấy danh sách đóng góp Donate
// =========================================================================
router.get('/donations', async (req, res) => {
  try {
    const { month } = req.query;
    const currentMonth = getCurrentMonthString();
    const targetMonth = month && month !== 'ALL' ? month : currentMonth;
    const { start: monthStart, end: monthEnd } = getMonthRangeUTC7(targetMonth);

    let query = { status: 'APPROVED' };
    if (month && month !== 'ALL') {
      query.created_at = { $gte: monthStart, $lte: monthEnd };
    }

    const list = await DonationSubmission.find(query)
      .sort({ created_at: -1 })
      .lean();

    const allUsers = await User.find({}).lean();
    const userMap = {};
    allUsers.forEach((u) => { userMap[u.id] = u; });

    const enriched = list.map((d) => ({
      ...d,
      display_name: userMap[d.user_id]?.display_name || '—',
      game_name: userMap[d.user_id]?.game_name || null,
      username: userMap[d.user_id]?.username || '—',
      reviewer_name: userMap[d.reviewed_by]?.display_name || null
    }));

    const allApproved = await DonationSubmission.find({ status: 'APPROVED' }).lean();
    const monthlyTotal = allApproved
      .filter((d) => new Date(d.created_at) >= monthStart && new Date(d.created_at) <= monthEnd)
      .reduce((sum, d) => sum + d.amount, 0);

    const allTimeTotal = allApproved.reduce((sum, d) => sum + d.amount, 0);

    res.json({
      currentMonth,
      monthlyTotal,
      allTimeTotal,
      totalCount: enriched.length,
      donations: enriched
    });
  } catch (err) {
    console.error('Error in GET /api/admin/donations:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// DELETE /api/admin/donations/:id - Xóa khoản Donate
// =========================================================================
router.delete('/donations/:id', async (req, res) => {
  try {
    const donationId = parseInt(req.params.id, 10);
    const donation = await DonationSubmission.findOne({ id: donationId });
    if (!donation) {
      return res.status(404).json({ error: 'Không tìm thấy khoản đóng góp Donate này.' });
    }

    if (donation.proof_image_path) {
      const fullPath = path.join(uploadsDir, donation.proof_image_path);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) {}
      }
    }

    await DonationSubmission.deleteOne({ id: donationId });
    await logAudit(req.user.id, 'DELETE_DONATION', 'DONATION_SUBMISSION', donationId, { amount: donation.amount });

    res.json({ message: 'Đã xóa khoản đóng góp Donate thành công' });
  } catch (err) {
    console.error('Error in DELETE /api/admin/donations/:id:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// GET /api/admin/donations/queue
router.get('/donations/queue', async (req, res) => {
  try {
    const list = await DonationSubmission.find({})
      .sort({ created_at: -1 })
      .lean();

    const allUsers = await User.find({}).lean();
    const userMap = {};
    allUsers.forEach((u) => { userMap[u.id] = u; });

    const enriched = list.map((d) => ({
      ...d,
      display_name: userMap[d.user_id]?.display_name || '—',
      game_name: userMap[d.user_id]?.game_name || null,
      username: userMap[d.user_id]?.username || '—',
      reviewer_name: userMap[d.reviewed_by]?.display_name || null
    }));

    res.json({ submissions: enriched });
  } catch (err) {
    console.error('Error in /api/admin/donations/queue:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// GET & POST & PUT /api/admin/members - Quản lý thành viên
// =========================================================================
router.get('/members', async (req, res) => {
  try {
    const currentMonth = getCurrentMonthString();
    const allUsers = await User.find({})
      .sort({ system_role: 1, id: 1 })
      .lean();

    const recipients = await DonationRecipient.find({ month: currentMonth, is_active: true }).lean();
    const recipientUserIds = new Set(recipients.map((r) => r.user_id));

    const allDonations = await DonationSubmission.find({ status: 'APPROVED' }).lean();
    const allClones = await CloneSubmission.find({ status: { $in: ['APPROVED', 'PARTIALLY_APPROVED'] } }).lean();

    const enriched = allUsers.map((u) => {
      const userDonated = allDonations
        .filter((d) => d.user_id === u.id)
        .reduce((sum, d) => sum + d.amount, 0);

      const userClones = allClones
        .filter((c) => c.user_id === u.id)
        .reduce((sum, c) => sum + (c.approved_count || c.declared_count || 0), 0);

      return {
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        game_name: u.game_name,
        system_role: u.system_role,
        status: u.status,
        created_at: u.created_at,
        contribution_type: u.system_role === 'ADMIN' ? null : (u.contribution_type || 'CLONE'),
        joined_date: u.joined_date,
        is_donation_recipient: recipientUserIds.has(u.id) ? 1 : 0,
        total_donated: userDonated,
        total_clones: userClones
      };
    });

    res.json({ members: enriched });
  } catch (err) {
    console.error('Error in GET /api/admin/members:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

router.post('/members', async (req, res) => {
  try {
    const { display_name, game_name, contribution_type } = req.body;

    if (!display_name || !display_name.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập tên hiển thị / tên thành viên.' });
    }

    const cType = ['CLONE', 'DONATE'].includes(contribution_type) ? contribution_type : 'CLONE';

    const newUserId = await getNextSequence('users');
    await User.create({
      id: newUserId,
      username: null,
      password_hash: null,
      display_name: display_name.trim(),
      game_name: game_name ? game_name.trim() : null,
      system_role: 'MEMBER',
      status: 'ACTIVE',
      contribution_type: cType,
      joined_date: new Date().toISOString().split('T')[0]
    });

    await logAudit(req.user.id, 'CREATE_MEMBER', 'USER', newUserId, {
      display_name: display_name.trim(),
      game_name: game_name ? game_name.trim() : null,
      contribution_type: cType
    });

    res.status(201).json({ message: 'Tạo thành viên mới thành công', userId: newUserId });
  } catch (err) {
    console.error('Error in POST /api/admin/members:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

router.put('/members/:id', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    const { display_name, game_name, status, contribution_type } = req.body;

    const user = await User.findOne({ id: memberId });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy thành viên.' });
    }

    if (display_name) user.display_name = display_name.trim();
    if (game_name !== undefined) user.game_name = game_name ? game_name.trim() : null;
    if (status && ['ACTIVE', 'INACTIVE', 'LEFT'].includes(status)) user.status = status;
    if (user.system_role === 'MEMBER' && contribution_type && ['CLONE', 'DONATE'].includes(contribution_type)) {
      user.contribution_type = contribution_type;
    }
    user.updated_at = new Date();
    await user.save();

    await logAudit(req.user.id, 'UPDATE_MEMBER', 'USER', memberId, req.body);

    res.json({ message: 'Cập nhật thành viên thành công' });
  } catch (err) {
    console.error('Error in PUT /api/admin/members/:id:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

router.post('/members/:id/toggle-recipient', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    const currentMonth = getCurrentMonthString();

    const user = await User.findOne({ id: memberId });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ thành viên.' });
    }

    const existing = await DonationRecipient.findOne({ user_id: memberId, month: currentMonth });

    let newStatus = true;
    if (existing) {
      newStatus = !existing.is_active;
      existing.is_active = newStatus;
      await existing.save();
    } else {
      const nextId = await getNextSequence('donation_recipients');
      await DonationRecipient.create({
        id: nextId,
        user_id: memberId,
        month: currentMonth,
        is_active: true,
        assigned_by: req.user.id
      });
    }

    await logAudit(req.user.id, 'TOGGLE_DONATION_RECIPIENT', 'USER', memberId, {
      month: currentMonth,
      is_active: newStatus
    });

    res.json({
      message: newStatus
        ? `Đã chỉ định ${user.display_name} làm người nhận Donate tháng ${currentMonth}`
        : `Đã hủy chỉ định nhận Donate của ${user.display_name} trong tháng ${currentMonth}`,
      is_donation_recipient: newStatus ? 1 : 0
    });
  } catch (err) {
    console.error('Error in toggle recipient:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// GET /api/admin/kpi/overview - Giám sát nộp clone theo ngày & tuần
// =========================================================================
router.get('/kpi/overview', async (req, res) => {
  try {
    const currentPeriod = await getOrCreateCurrentPeriod();
    const weeklyTarget = currentPeriod.target_value || 21;
    const dailyTarget = currentPeriod.daily_target || 3;
    const todayStr = getTodayString();
    const { start: todayStart, end: todayEnd } = getTodayRangeUTC7(todayStr);

    // Chỉ lấy thành viên CÀY CLONE active (thành viên Donate không cày acc)
    const cloneMembers = await User.find({
      system_role: 'MEMBER',
      status: 'ACTIVE',
      contribution_type: 'CLONE'
    }).lean();

    const cloneUserIds = cloneMembers.map((u) => u.id);

    const todaySubs = await CloneSubmission.find({
      user_id: { $in: cloneUserIds },
      created_at: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    const weekSubs = await CloneSubmission.find({
      user_id: { $in: cloneUserIds },
      period_id: currentPeriod.id
    }).lean();

    const violations = await ViolationAction.find({ period_id: currentPeriod.id }).lean();
    const allUsers = await User.find({}).lean();
    const userMap = {};
    allUsers.forEach((u) => { userMap[u.id] = u; });

    const violationMap = {};
    violations.forEach((v) => {
      if (!violationMap[v.user_id]) violationMap[v.user_id] = [];
      violationMap[v.user_id].push({
        ...v,
        decider_name: userMap[v.decided_by]?.display_name || 'Admin'
      });
    });

    const membersProgress = cloneMembers.map((m) => {
      const todayCount = todaySubs
        .filter((s) => s.user_id === m.id)
        .reduce((sum, s) => sum + (s.declared_count || 0), 0);

      const approvedCount = weekSubs
        .filter((s) => s.user_id === m.id)
        .reduce((sum, s) => sum + (s.declared_count || 0), 0);

      let kpiStatus = 'IN_PROGRESS';
      if (approvedCount >= weeklyTarget) {
        kpiStatus = 'ACHIEVED';
      } else if (currentPeriod.is_closed) {
        kpiStatus = 'MISSED';
      }

      return {
        id: m.id,
        username: m.username,
        display_name: m.display_name,
        game_name: m.game_name,
        status: m.status,
        contribution_type: 'CLONE',
        today_count: todayCount,
        approved_count: approvedCount,
        pending_count: 0,
        kpiStatus,
        violations: violationMap[m.id] || []
      };
    });

    membersProgress.sort((a, b) => a.today_count - b.today_count || a.approved_count - b.approved_count);

    res.json({
      period: {
        id: currentPeriod.id,
        code: currentPeriod.code,
        start_date: currentPeriod.start_date,
        end_date: currentPeriod.end_date,
        target_value: weeklyTarget,
        daily_target: dailyTarget,
        is_closed: currentPeriod.is_closed ? 1 : 0
      },
      dailyTarget,
      weeklyTarget,
      todayStr,
      members: membersProgress
    });
  } catch (err) {
    console.error('Error in /api/admin/kpi/overview:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// POST /api/admin/kpi/violations - Ghi nhận quyết định xử lý vi phạm KPI
// =========================================================================
router.post('/kpi/violations', async (req, res) => {
  try {
    const { user_id, period_id, action_type, note } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'Thiếu thông tin thành viên.' });
    }

    const currentPeriod = period_id ? { id: period_id } : await getOrCreateCurrentPeriod();
    const action = action_type || 'REMINDER';

    const nextId = await getNextSequence('violation_actions');
    const created = await ViolationAction.create({
      id: nextId,
      user_id: parseInt(user_id, 10),
      period_id: currentPeriod.id,
      action_type: action,
      note: note ? note.trim() : null,
      decided_by: req.user.id
    });

    await logAudit(req.user.id, 'RECORD_VIOLATION', 'USER', user_id, {
      period_id: currentPeriod.id,
      action_type: action,
      note
    });

    res.status(201).json({
      message: 'Đã lưu quyết định xử lý vi phạm thành công',
      violationId: nextId
    });
  } catch (err) {
    console.error('Error in /api/admin/kpi/violations:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// GET /api/admin/recipients/summary - Bảng tổng hợp nhận donate
// =========================================================================
router.get('/recipients/summary', async (req, res) => {
  try {
    const currentMonth = getCurrentMonthString();
    const targetMonth = req.query.month || currentMonth;
    const { start: monthStart, end: monthEnd } = getMonthRangeUTC7(targetMonth);

    const approvedDonations = await DonationSubmission.find({
      status: 'APPROVED',
      created_at: { $gte: monthStart, $lte: monthEnd }
    }).lean();
    const poolTotal = approvedDonations.reduce((sum, d) => sum + d.amount, 0);

    const activeRecipients = await DonationRecipient.find({
      month: targetMonth,
      is_active: true
    }).lean();

    const recipientUserIds = activeRecipients.map((r) => r.user_id);
    const recipientUsers = await User.find({ id: { $in: recipientUserIds } }).lean();
    const userMap = {};
    recipientUsers.forEach((u) => { userMap[u.id] = u; });

    const monthSubs = await CloneSubmission.find({
      user_id: { $in: recipientUserIds },
      status: { $in: ['APPROVED', 'PARTIALLY_APPROVED'] },
      created_at: { $gte: monthStart, $lte: monthEnd }
    }).lean();

    const baseline = 100;
    const list = activeRecipients.map((r) => {
      const u = userMap[r.user_id];
      const monthlyApproved = monthSubs
        .filter((s) => s.user_id === r.user_id)
        .reduce((sum, s) => sum + (s.approved_count || s.declared_count || 0), 0);
      const excess = Math.max(0, monthlyApproved - baseline);

      return {
        user_id: r.user_id,
        display_name: u?.display_name || '—',
        username: u?.username || '—',
        game_name: u?.game_name || null,
        monthly_approved: monthlyApproved,
        excess_clones: excess
      };
    });

    const totalExcess = list.reduce((sum, item) => sum + item.excess_clones, 0);
    const enrichedList = list.map((item) => {
      let share = 0;
      if (totalExcess > 0 && item.excess_clones > 0) {
        share = Math.round((item.excess_clones / totalExcess) * poolTotal);
      }
      return {
        ...item,
        estimated_share_amount: share
      };
    });

    res.json({
      month: targetMonth,
      poolTotal,
      recipientCount: enrichedList.length,
      baseline,
      recipients: enrichedList
    });
  } catch (err) {
    console.error('Error in /api/admin/recipients/summary:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// GET & PUT /api/admin/settings - Quản lý tài khoản ngân hàng / QR của Box
// =========================================================================
router.get('/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({ id: 1 }).lean();
    if (!settings) {
      settings = {
        bank_name: 'MB Bank (Quân Đội)',
        bank_account_number: '999988887777',
        bank_account_holder: 'NGUYEN VAN ADMIN',
        qr_code_note: 'DONATE BOX CHAT'
      };
    }
    res.json({ settings });
  } catch (err) {
    console.error('Error in GET /api/admin/settings:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { bank_name, bank_account_number, bank_account_holder, qr_code_note } = req.body;

    const update = {};
    if (bank_name) update.bank_name = bank_name.trim();
    if (bank_account_number) update.bank_account_number = bank_account_number.trim();
    if (bank_account_holder) update.bank_account_holder = bank_account_holder.trim();
    if (qr_code_note !== undefined) update.qr_code_note = qr_code_note.trim();

    const settings = await SystemSettings.findOneAndUpdate(
      { id: 1 },
      { $set: update },
      { returnDocument: 'after', upsert: true }
    ).lean();

    await logAudit(req.user.id, 'UPDATE_SYSTEM_SETTINGS', 'SYSTEM_SETTINGS', 1, req.body);

    res.json({ message: 'Cập nhật thông tin ngân hàng thành công', settings });
  } catch (err) {
    console.error('Error in PUT /api/admin/settings:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

// =========================================================================
// GET /api/admin/audit-logs
// =========================================================================
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    const actorIds = [...new Set(logs.map((l) => l.actor_id).filter(Boolean))];
    const actors = await User.find({ id: { $in: actorIds } }).lean();
    const actorMap = {};
    actors.forEach((a) => { actorMap[a.id] = a.display_name; });

    const enriched = logs.map((l) => ({
      ...l,
      actor_name: actorMap[l.actor_id] || 'Hệ thống'
    }));

    res.json({ logs: enriched });
  } catch (err) {
    console.error('Error in /api/admin/audit-logs:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

module.exports = router;
