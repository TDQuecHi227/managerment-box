import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ShieldAlert,
  FileText,
  PlusCircle,
  Calendar,
  X,
  Check,
  Search,
  History,
  Swords,
  ChevronRight,
  User,
  Plus,
  Layers
} from 'lucide-react';

export default function AdminKPI() {
  const { apiFetch } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('CURRENT_KPI'); // CURRENT_KPI | MONTHLY_HISTORY

  // KPI Current Data
  const [kpiData, setKpiData] = useState(null);
  const [loadingKPI, setLoadingKPI] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterToday, setFilterToday] = useState('ALL'); // ALL | UNSUBMITTED | PARTIAL | ACHIEVED

  // Monthly History Data
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');

  // Violation action modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [actionType, setActionType] = useState('REMINDER'); // REMINDER | WARNING | INACTIVE_PENALTY | NOTE
  const [actionNote, setActionNote] = useState('');
  const [recording, setRecording] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Quick Add Clone modal (Hỗ trợ 2 thao tác: Nộp thêm vào List có sẵn hoặc Tạo List mới)
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberLists, setMemberLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [cloneOpMode, setCloneOpMode] = useState('ADD_TO_EXISTING'); // 'ADD_TO_EXISTING' | 'CREATE_NEW'

  // Form Thao tác 2: Nộp thêm vào List có sẵn
  const [targetListId, setTargetListId] = useState('');
  const [addCount, setAddCount] = useState('3');
  const [addDate, setAddDate] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
  const [addNote, setAddNote] = useState('');

  // Form Thao tác 1: Tạo List Clone mới
  const [newAccountName, setNewAccountName] = useState('');
  const [newCount, setNewCount] = useState('3');
  const [newDate, setNewDate] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');

  const [submittingClone, setSubmittingClone] = useState(false);
  const [cloneError, setCloneError] = useState('');

  const fetchKPIOverview = async () => {
    try {
      setLoadingKPI(true);
      const res = await apiFetch('/api/admin/kpi/overview');
      if (res.ok) {
        const json = await res.json();
        setKpiData(json);
      }
    } catch (err) {
      console.error('Error fetching KPI overview', err);
    } finally {
      setLoadingKPI(false);
    }
  };

  const fetchMonthlyHistory = async (monthToFetch = '') => {
    try {
      setLoadingHistory(true);
      const url = monthToFetch
        ? `/api/admin/clones/monthly-history?month=${monthToFetch}`
        : '/api/admin/clones/monthly-history';
      const res = await apiFetch(url);
      if (res.ok) {
        const json = await res.json();
        setHistoryData(json);
        if (!selectedMonth) {
          setSelectedMonth(json.month);
        }
      }
    } catch (err) {
      console.error('Error fetching monthly history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchKPIOverview();
    fetchMonthlyHistory();
  }, []);

  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setSelectedMonth(newMonth);
    fetchMonthlyHistory(newMonth);
  };


  const openViolationModal = (member) => {
    setSelectedMember(member);
    setActionType('REMINDER');
    setActionNote('');
    setMsg({ type: '', text: '' });
  };

  const handleRecordViolation = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    setMsg({ type: '', text: '' });
    setRecording(true);

    try {
      const res = await apiFetch('/api/admin/kpi/violations', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedMember.id,
          period_id: kpiData?.period?.id,
          action_type: actionType,
          note: actionNote
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ghi nhận thất bại');
      }

      setMsg({ type: 'success', text: 'Đã lưu quyết định xử lý!' });
      fetchKPIOverview();
      setTimeout(() => {
        setSelectedMember(null);
        setMsg({ type: '', text: '' });
      }, 1200);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setRecording(false);
    }
  };

  const members = kpiData?.members || [];
  const period = kpiData?.period;
  const weeklyTarget = kpiData?.weeklyTarget || 21;
  const dailyTarget = kpiData?.dailyTarget || 3;

  // Lấy danh sách List Clone của thành viên được chọn
  const loadListsForUser = async (userId, userObj = null) => {
    if (!userId) {
      setMemberLists([]);
      setCloneOpMode('CREATE_NEW');
      return;
    }
    setLoadingLists(true);
    try {
      const res = await apiFetch(`/api/admin/clone-lists?user_id=${userId}`);
      if (res.ok) {
        const json = await res.json();
        const lists = json.lists || [];
        setMemberLists(lists);
        if (lists.length > 0) {
          setCloneOpMode('ADD_TO_EXISTING');
          setTargetListId(String(lists[0].id));
          setAddNote(lists[0].raw_note || '');
        } else {
          setCloneOpMode('CREATE_NEW');
          setTargetListId('');
          setAddNote('');
          const m = userObj || members.find((u) => String(u.id) === String(userId));
          if (m) {
            const safeName = (m.game_name || m.display_name || 'acc').toLowerCase().replace(/\s+/g, '_');
            setNewAccountName(`caisbang_${safeName}`);
          }
        }
      } else {
        setMemberLists([]);
        setCloneOpMode('CREATE_NEW');
      }
    } catch (err) {
      console.error('Error fetching member clone lists', err);
      setMemberLists([]);
      setCloneOpMode('CREATE_NEW');
    } finally {
      setLoadingLists(false);
    }
  };

  const openAddCloneModal = async (member = null) => {
    const targetUserId = member ? String(member.id) : members[0] ? String(members[0].id) : '';
    setSelectedUserId(targetUserId);
    setCloneError('');
    setAddCount('3');
    setAddDate(new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
    setNewCount('3');
    setNewDate(new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
    if (member) {
      const safeName = (member.game_name || member.display_name || 'acc').toLowerCase().replace(/\s+/g, '_');
      setNewAccountName(`caisbang_${safeName}`);
    } else {
      setNewAccountName('');
    }
    setNewNote('');
    setShowCloneModal(true);
    await loadListsForUser(targetUserId, member);
  };

  const handleMemberChange = async (userIdStr) => {
    setSelectedUserId(userIdStr);
    const m = members.find((u) => String(u.id) === String(userIdStr));
    if (m) {
      const safeName = (m.game_name || m.display_name || 'acc').toLowerCase().replace(/\s+/g, '_');
      setNewAccountName(`caisbang_${safeName}`);
    }
    await loadListsForUser(userIdStr, m);
  };

  const handleSelectTargetList = (listIdStr) => {
    setTargetListId(listIdStr);
    const selected = memberLists.find((l) => String(l.id) === String(listIdStr));
    if (selected) {
      setAddNote(selected.raw_note || '');
    }
  };

  const handleSubmitClone = async (e) => {
    e.preventDefault();
    setCloneError('');

    if (!selectedUserId) {
      setCloneError('Vui lòng chọn thành viên.');
      return;
    }

    if (cloneOpMode === 'ADD_TO_EXISTING') {
      if (!targetListId) {
        setCloneError('Vui lòng chọn List Clone để nộp thêm.');
        return;
      }
      const countNum = parseInt(addCount, 10);
      if (!countNum || countNum <= 0) {
        setCloneError('Số lượng acc nộp thêm phải lớn hơn 0.');
        return;
      }

      setSubmittingClone(true);
      try {
        const res = await apiFetch(`/api/admin/clone-lists/${targetListId}/add-clones`, {
          method: 'POST',
          body: JSON.stringify({
            count: countNum,
            submission_date: addDate,
            raw_note: addNote.trim()
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Cập nhật nộp thêm Clone thất bại');
        }

        setShowCloneModal(false);
        await fetchKPIOverview();
        if (activeSubTab === 'MONTHLY_HISTORY') {
          await fetchMonthlyHistory(selectedMonth);
        }
      } catch (err) {
        setCloneError(err.message);
      } finally {
        setSubmittingClone(false);
      }
    } else {
      // CREATE_NEW
      if (!newAccountName || !newAccountName.trim()) {
        setCloneError('Vui lòng nhập Tên tài khoản của list mới.');
        return;
      }
      const countNum = parseInt(newCount, 10);
      if (!countNum || countNum <= 0) {
        setCloneError('Số lượng acc phải lớn hơn 0.');
        return;
      }

      setSubmittingClone(true);
      try {
        const res = await apiFetch('/api/admin/clone-lists', {
          method: 'POST',
          body: JSON.stringify({
            user_id: parseInt(selectedUserId, 10),
            account_name: newAccountName.trim(),
            count: countNum,
            submission_date: newDate,
            raw_note: newNote.trim()
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Tạo List Clone mới thất bại');
        }

        setShowCloneModal(false);
        await fetchKPIOverview();
        if (activeSubTab === 'MONTHLY_HISTORY') {
          await fetchMonthlyHistory(selectedMonth);
        }
      } catch (err) {
        setCloneError(err.message);
      } finally {
        setSubmittingClone(false);
      }
    }
  };

  // Quick stats
  const unsubmittedTodayCount = members.filter((m) => (m.today_count || 0) === 0).length;
  const partialTodayCount = members.filter((m) => (m.today_count || 0) > 0 && (m.today_count || 0) < dailyTarget).length;
  const achievedTodayCount = members.filter((m) => (m.today_count || 0) >= dailyTarget).length;
  const achievedWeekCount = members.filter((m) => (m.approved_count || 0) >= weeklyTarget).length;

  // Filtered members list for Current KPI
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      m.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.game_name && m.game_name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterToday === 'UNSUBMITTED') {
      return (m.today_count || 0) === 0;
    }
    if (filterToday === 'PARTIAL') {
      return (m.today_count || 0) > 0 && (m.today_count || 0) < dailyTarget;
    }
    if (filterToday === 'ACHIEVED') {
      return (m.today_count || 0) >= dailyTarget;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="text-blue-600" size={24} />
            KPI & Lịch Sử Cày Clone (Cái bang)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi nộp clone 3 acc/ngày, 21 acc/tuần và lưu trữ lịch sử cày acc của thành viên theo tuần trong tháng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-Tab Navigation Toggle */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('CURRENT_KPI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'CURRENT_KPI'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award size={14} />
              <span>KPI Ngày & Tuần</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('MONTHLY_HISTORY');
                if (!historyData) fetchMonthlyHistory();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'MONTHLY_HISTORY'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History size={14} />
              <span>Lịch Sử Cày Tháng</span>
            </button>
          </div>

          <button
            onClick={() => openAddCloneModal(null)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>+ Nhập Clone</span>
          </button>

          <button
            onClick={() => {
              if (activeSubTab === 'CURRENT_KPI') fetchKPIOverview();
              else fetchMonthlyHistory(selectedMonth);
            }}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: GIÁM SÁT KPI NGÀY (3 ACC) & TUẦN (21 ACC) HIỆN TẠI
         ========================================================================= */}
      {activeSubTab === 'CURRENT_KPI' && (
        <div className="space-y-6">
          {/* KPI Overview 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Chưa nộp hôm nay */}
            <div
              onClick={() => setFilterToday(filterToday === 'UNSUBMITTED' ? 'ALL' : 'UNSUBMITTED')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                filterToday === 'UNSUBMITTED'
                  ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400'
                  : 'bg-white border-slate-200 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-600">
                <span>Chưa nộp hôm nay</span>
                <AlertTriangle size={18} />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-rose-600">{unsubmittedTodayCount}</span>
                <span className="text-xs text-slate-500">/ {members.length} thành viên</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Chưa có clone nào ghi nhận hôm nay (0/{dailyTarget})</p>
            </div>

            {/* Card 2: Thiếu clone hôm nay */}
            <div
              onClick={() => setFilterToday(filterToday === 'PARTIAL' ? 'ALL' : 'PARTIAL')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                filterToday === 'PARTIAL'
                  ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400'
                  : 'bg-white border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-600">
                <span>Thiếu clone hôm nay</span>
                <Clock size={18} />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-amber-600">{partialTodayCount}</span>
                <span className="text-xs text-slate-500">thành viên</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Đã nộp 1 - 2 clone (chưa đủ 3 clone)</p>
            </div>

            {/* Card 3: Đã đạt chỉ tiêu ngày */}
            <div
              onClick={() => setFilterToday(filterToday === 'ACHIEVED' ? 'ALL' : 'ACHIEVED')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                filterToday === 'ACHIEVED'
                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400'
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-600">
                <span>Đã đạt hôm nay</span>
                <CheckCircle2 size={18} />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-emerald-600">{achievedTodayCount}</span>
                <span className="text-xs text-slate-500">/ {members.length} thành viên</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Đã hoàn thành ≥ 3 clone trong ngày</p>
            </div>

            {/* Card 4: Đã hoàn thành cả tuần */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-600">
                <span>Đạt KPI Tuần</span>
                <Award size={18} />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-blue-600">{achievedWeekCount}</span>
                <span className="text-xs text-slate-500">/ {members.length} thành viên</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Đã tích lũy ≥ {weeklyTarget} clone trong tuần</p>
            </div>
          </div>

          {/* Rules Notice */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
            <p className="font-semibold text-blue-950 flex items-center gap-1.5">
              <ShieldAlert size={15} className="text-blue-600" />
              Chính sách giám sát nộp Clone Cái bang:
            </p>
            <p>• Mỗi thành viên nộp đều đặn <b className="text-blue-950">3 acc/ngày</b> (Tổng cả tuần đạt <b className="text-blue-950">21 acc/tuần</b>). Mỗi ngày số acc đã nộp tự động reset và mỗi tuần reset KPI về 0.</p>
            <p>• Admin nhận tin nhắn từ thành viên ở app khác, bấm <b>"+ Nhập Clone"</b> để ghi nhận: nộp thêm vào list hiện có hoặc tạo list mới với tên tài khoản và ghi chú (tên tk + stt + mật khẩu).</p>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setFilterToday('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterToday === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({members.length})
              </button>
              <button
                onClick={() => setFilterToday('UNSUBMITTED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterToday === 'UNSUBMITTED'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Chưa nộp hôm nay ({unsubmittedTodayCount})
              </button>
              <button
                onClick={() => setFilterToday('PARTIAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterToday === 'PARTIAL'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Thiếu clone ({partialTodayCount})
              </button>
              <button
                onClick={() => setFilterToday('ACHIEVED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterToday === 'ACHIEVED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Đạt hôm nay ({achievedTodayCount})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, IGN, tài khoản..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* KPI Monitoring Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {loadingKPI ? (
              <div className="p-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Không tìm thấy thành viên nào phù hợp với bộ lọc.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Thành viên</th>
                      <th className="px-4 py-3.5">Nick Game (IGN)</th>
                      <th className="px-4 py-3.5">Hôm nay (Chỉ tiêu 3)</th>
                      <th className="px-4 py-3.5">Cả tuần (Chỉ tiêu 21)</th>
                      <th className="px-4 py-3.5">Trạng thái Tuần</th>
                      <th className="px-5 py-3.5">Quyết định xử lý</th>
                      <th className="px-5 py-3.5 text-right">Thao tác Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map((m) => {
                      const todayCount = m.today_count || 0;
                      const isTodayAchieved = todayCount >= dailyTarget;
                      const isTodayZero = todayCount === 0;

                      const weekCount = m.approved_count || 0;
                      const isWeekAchieved = weekCount >= weeklyTarget;
                      const weekPercent = Math.min(100, Math.round((weekCount / weeklyTarget) * 100));

                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-4">
                            <div>
                              <span className="font-semibold text-slate-900 block">{m.display_name}</span>
                              <span className="text-[11px] text-slate-400 font-mono">ID: #{m.id}</span>
                            </div>
                          </td>

                          <td className="px-4 py-4 font-mono text-xs text-blue-700">
                            {m.game_name || '—'}
                          </td>

                          {/* Hôm nay */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {isTodayAchieved ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 size={12} /> Đạt ({todayCount}/{dailyTarget})
                              </span>
                            ) : isTodayZero ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                <Clock size={12} /> Chưa nộp (0/{dailyTarget})
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                                <AlertTriangle size={12} /> Thiếu {dailyTarget - todayCount} ({todayCount}/{dailyTarget})
                              </span>
                            )}
                          </td>

                          {/* Cả tuần */}
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className={`font-bold ${isWeekAchieved ? 'text-emerald-600' : 'text-slate-800'}`}>
                                  {weekCount} / {weeklyTarget}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">{weekPercent}%</span>
                              </div>
                              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isWeekAchieved ? 'bg-emerald-600' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${weekPercent}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Trạng thái Tuần */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {m.kpiStatus === 'ACHIEVED' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 size={12} /> Đạt chỉ tiêu
                              </span>
                            ) : m.kpiStatus === 'MISSED' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 inline-flex items-center gap-1">
                                <XCircle size={12} /> Không đạt
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                                <Clock size={12} /> Đang tiến hành
                              </span>
                            )}
                          </td>

                          {/* Quyết định xử lý */}
                          <td className="px-5 py-4 text-xs">
                            {m.violations && m.violations.length > 0 ? (
                              <div className="space-y-1 max-w-[200px]">
                                {m.violations.map((v) => (
                                  <div key={v.id} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                                    <span className="font-bold text-slate-800">
                                      {v.action_type === 'REMINDER' && '🔔 Nhắc nhở'}
                                      {v.action_type === 'WARNING' && '⚠️ Cảnh cáo'}
                                      {v.action_type === 'INACTIVE_PENALTY' && '⛔ Khóa tạm'}
                                      {v.action_type === 'NOTE' && '📝 Ghi chú'}
                                    </span>
                                    {v.note && <span className="text-slate-600 block text-[11px] mt-0.5 truncate" title={v.note}>{v.note}</span>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Thao tác Admin */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => openAddCloneModal(m)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition inline-flex items-center gap-1 cursor-pointer"
                                title="Nhập Clone cho thành viên này"
                              >
                                <PlusCircle size={13} />
                                <span>+ Nhập Clone</span>
                              </button>

                              <button
                                onClick={() => openViolationModal(m)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                                title="Ghi nhận xử lý vi phạm"
                              >
                                <FileText size={13} />
                                <span>Xử lý</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LỊCH SỬ CÀY CLONE THEO THÁNG (LƯU THEO TUẦN)
         ========================================================================= */}
      {activeSubTab === 'MONTHLY_HISTORY' && (
        <div className="space-y-6">
          {/* Header Bar: Chọn tháng & Tổng quan box */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <History size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Lịch Sử Cày Clone Tháng {historyData?.month || selectedMonth}
                </h2>
                <p className="text-xs text-slate-500">
                  Tổng hợp số acc từng thành viên cày được trong tháng, lưu vết theo từng tuần (21 acc/tuần).
                </p>
              </div>
            </div>

            {/* Bộ chọn tháng */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Chọn tháng:</span>
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {historyData?.availableMonths?.map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3 Metric Cards Tháng */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng acc cày trong tháng</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-600">
                  {historyData?.totalBoxClones || 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">acc clone</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Ghi nhận cho toàn bộ box trong tháng {selectedMonth}</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số kỳ tuần trong tháng</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {historyData?.periods?.length || 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">kỳ tuần</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Định mức chuẩn: 21 acc / tuần / thành viên</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Cày Clone tháng</span>
              <div className="mt-2">
                {historyData?.members?.[0] ? (
                  <div>
                    <span className="text-lg font-extrabold text-emerald-600 block truncate">
                      🥇 {historyData.members[0].display_name}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Đã cày {historyData.members[0].totalMonthClones} acc
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Chưa có dữ liệu</span>
                )}
              </div>
            </div>
          </div>

          {/* Bảng Lịch Sử Chi Tiết Theo Tuần Trong Tháng */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {loadingHistory ? (
              <div className="p-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !historyData?.members || historyData.members.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Chưa có dữ liệu cày clone trong tháng {selectedMonth}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Thành viên</th>
                      <th className="px-4 py-3.5">Hình thức</th>
                      {/* Cột cho từng tuần trong tháng */}
                      {historyData.periods?.map((p, idx) => (
                        <th key={p.id} className="px-4 py-3.5 text-center">
                          <span className="block font-bold text-slate-800">Tuần {idx + 1}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({p.code})
                          </span>
                        </th>
                      ))}
                      <th className="px-5 py-3.5 text-center font-bold text-blue-700 bg-blue-50/50">
                        Tổng Tháng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyData.members.map((m) => {
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-5 py-4">
                            <div>
                              <span className="font-bold text-slate-900 block">{m.display_name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-slate-400 font-mono">ID: #{m.id}</span>
                                {m.game_name && (
                                  <span className="text-[11px] font-semibold text-blue-600 font-mono">
                                    • IGN: {m.game_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            {m.contribution_type === 'CLONE' ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                🎮 Cày Clone
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                🪙 Donate
                              </span>
                            )}
                          </td>

                          {/* Các cột tuần */}
                          {m.weeklyBreakdown?.map((w) => {
                            const count = w.count || 0;
                            const isAchieved = count >= (w.target || 21);

                            return (
                              <td key={w.periodId} className="px-4 py-4 text-center whitespace-nowrap">
                                <div className="inline-flex flex-col items-center">
                                  <span className={`text-sm font-extrabold ${isAchieved ? 'text-emerald-600' : count > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                    {count} acc
                                  </span>
                                  {count > 0 ? (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${isAchieved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                      {isAchieved ? 'Đạt' : `Thiếu ${w.target - count}`}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">0/21</span>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          {/* Cột Tổng Tháng */}
                          <td className="px-5 py-4 text-center whitespace-nowrap bg-blue-50/30">
                            <span className="text-base font-black text-blue-700">
                              {m.totalMonthClones} acc
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: GHI NHẬN XỬ LÝ VI PHẠM
         ========================================================================= */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-md w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="text-blue-600" size={18} />
                Xử lý vi phạm: {selectedMember.display_name}
              </h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordViolation} className="p-6 space-y-4">
              {msg.text && (
                <div
                  className={`p-3 rounded-xl text-sm flex items-start gap-2 ${
                    msg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <span>{msg.type === 'success' ? '✅' : '⚠️'}</span>
                  <span>{msg.text}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p>Thành viên: <b className="text-slate-900">{selectedMember.display_name}</b> {selectedMember.game_name ? `(${selectedMember.game_name})` : ''}</p>
                <p>Hôm nay: <b className="text-blue-600">{selectedMember.today_count || 0}</b> / {dailyTarget} clone</p>
                <p>Cả tuần: <b className="text-blue-600">{selectedMember.approved_count}</b> / {weeklyTarget} clone</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Hình thức xử lý của Admin *
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="REMINDER">🔔 Nhắc nhở nộp clone</option>
                  <option value="WARNING">⚠️ Cảnh cáo lần 1 / lần 2</option>
                  <option value="INACTIVE_PENALTY">⛔ Tạm ngưng quyền lợi / Khóa</option>
                  <option value="NOTE">📝 Ghi chú lý do riêng (có phép / nộp bù)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ghi chú chi tiết lý do & thỏa thuận
                </label>
                <textarea
                  rows="3"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Ví dụ: Xin nộp bù vào ngày mai; cảnh cáo không phản hồi..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={recording}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {recording ? 'Đang lưu...' : 'Lưu quyết định'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: NHẬP CLONE CHO THÀNH VIÊN (2 THAO TÁC: NỘP THÊM HOẶC TẠO LIST MỚI)
         ========================================================================= */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="text-blue-600" size={18} />
                <span>Nhập Clone cho thành viên</span>
              </h3>
              <button
                onClick={() => setShowCloneModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitClone} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {cloneError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>{cloneError}</span>
                </div>
              )}

              {/* 1. Chọn thành viên nộp clone (chỉ hiện Tên và IGN, KHÔNG CÓ "Hôm nay 0/3") */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                  <User size={13} className="text-slate-400" />
                  Thành viên nộp Clone *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  required
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name} {m.game_name ? `(${m.game_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Chọn hình thức: Nộp thêm vào list có sẵn HOẶC Tạo list mới */}
              {loadingLists ? (
                <div className="py-6 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[11px] text-slate-400 mt-1">Đang tải danh sách list clone...</p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCloneOpMode('ADD_TO_EXISTING')}
                      disabled={memberLists.length === 0}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        cloneOpMode === 'ADD_TO_EXISTING'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : memberLists.length === 0
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layers size={13} />
                      <span>Nộp thêm vào List ({memberLists.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCloneOpMode('CREATE_NEW')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        cloneOpMode === 'CREATE_NEW'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Plus size={13} />
                      <span>+ Tạo List Clone mới</span>
                    </button>
                  </div>

                  {/* THAO TÁC 2: CẬP NHẬT NỘP THÊM VÀO LIST CÓ SẴN */}
                  {cloneOpMode === 'ADD_TO_EXISTING' && (
                    <div className="space-y-4 pt-1 animate-fadeIn">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                          <Layers size={13} className="text-slate-400" />
                          Chọn List Clone của thành viên *
                        </label>
                        <select
                          value={targetListId}
                          onChange={(e) => handleSelectTargetList(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          required
                        >
                          {memberLists.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.account_name} — (Hiện có: {l.total_count} acc)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                            <Calendar size={13} className="text-slate-400" />
                            Ngày ghi nhận
                          </label>
                          <input
                            type="date"
                            value={addDate}
                            onChange={(e) => setAddDate(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                            <span>Số lượng acc nộp *</span>
                            <span className="text-[11px] text-blue-600 font-normal">Định mức 3/ngày</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={addCount}
                            onChange={(e) => setAddCount(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-extrabold focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Ghi chú tài khoản (Cập nhật / thêm mới tên tk, STT, pass)
                        </label>
                        <textarea
                          rows={3}
                          value={addNote}
                          onChange={(e) => setAddNote(e.target.value)}
                          placeholder="Nhập tên tk + stt và mật khẩu nộp thêm..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          Tip: Điền hoặc nối tiếp tài khoản mới vào ghi chú (Ví dụ: caisbang_bao04-06 | pass: 123456)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* THAO TÁC 1: TẠO LIST CLONE MỚI (KHI THÀNH VIÊN NỘP TÊN TK KHÁC) */}
                  {cloneOpMode === 'CREATE_NEW' && (
                    <div className="space-y-4 pt-1 animate-fadeIn">
                      {memberLists.length === 0 && (
                        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-800">
                          Thành viên này chưa có List Clone nào. Vui lòng tạo List mới bên dưới:
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Tên tài khoản (Gốc / Tên List mới) *
                        </label>
                        <input
                          type="text"
                          value={newAccountName}
                          onChange={(e) => setNewAccountName(e.target.value)}
                          placeholder="Ví dụ: caisbang_bao, longsat..."
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                            <Calendar size={13} className="text-slate-400" />
                            Ngày ghi nhận
                          </label>
                          <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                            <span>Số lượng acc *</span>
                            <span className="text-[11px] text-blue-600 font-normal">Định mức 3/ngày</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={newCount}
                            onChange={(e) => setNewCount(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-extrabold focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Ghi chú tài khoản (Tên tk + STT + Mật khẩu)
                        </label>
                        <textarea
                          rows={3}
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Nhập tên tài khoản, STT và mật khẩu ở đây..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          Ví dụ: caisbang_bao01-03 | pass: 123456
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Form Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCloneModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingClone || loadingLists}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingClone ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Check size={14} />
                  )}
                  <span>
                    {cloneOpMode === 'ADD_TO_EXISTING'
                      ? `Lưu nộp thêm (+${addCount} acc)`
                      : `Tạo & Lưu List mới (${newCount} acc)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
