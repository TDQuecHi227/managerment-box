import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Coins,
  Award,
  ArrowRight,
  RefreshCw,
  Swords,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  PlusCircle,
  Gamepad2,
  Calendar,
  X,
  Plus,
  Layers,
  User
} from 'lucide-react';
import ImageModal from '../components/ImageModal';

export default function AdminDashboard({ setActiveTab }) {
  const { apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Modal 1: Tạo List Clone mới
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newCount, setNewCount] = useState('3');
  const [newDate, setNewDate] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');
  const [submittingNew, setSubmittingNew] = useState(false);
  const [newError, setNewError] = useState('');

  // Modal 2: Cập nhật List Clone (Nộp thêm Clone vào List)
  const [showAddClonesModal, setShowAddClonesModal] = useState(false);
  const [targetList, setTargetList] = useState(null);
  const [addCount, setAddCount] = useState('3');
  const [addDate, setAddDate] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
  const [addNote, setAddNote] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const handleCopyNote = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- THAO TÁC 1: TẠO LIST CLONE MỚI ---
  const openNewListModal = (memberId = null) => {
    const defaultUserId = memberId
      ? String(memberId)
      : data?.memberKPIProgress?.[0]?.id
      ? String(data.memberKPIProgress[0].id)
      : '';
    setNewUserId(defaultUserId);
    setNewAccountName('');
    setNewCount('3');
    setNewDate(new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
    setNewNote('');
    setNewError('');
    setShowNewListModal(true);
  };

  const handleCreateNewList = async (e) => {
    e.preventDefault();
    setNewError('');

    if (!newUserId) {
      setNewError('Vui lòng chọn thành viên.');
      return;
    }

    if (!newAccountName || !newAccountName.trim()) {
      setNewError('Vui lòng nhập Tên tài khoản của list mới.');
      return;
    }

    const countNum = parseInt(newCount, 10);
    if (!countNum || countNum <= 0) {
      setNewError('Số lượng acc phải lớn hơn 0.');
      return;
    }

    setSubmittingNew(true);
    try {
      const res = await apiFetch('/api/admin/clone-lists', {
        method: 'POST',
        body: JSON.stringify({
          user_id: parseInt(newUserId, 10),
          account_name: newAccountName.trim(),
          count: countNum,
          submission_date: newDate,
          raw_note: newNote.trim()
        })
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Tạo List Clone mới thất bại');
      }

      setShowNewListModal(false);
      await fetchStats();
    } catch (err) {
      setNewError(err.message);
    } finally {
      setSubmittingNew(false);
    }
  };

  // --- THAO TÁC 2: CẬP NHẬT LIST CLONE (NỘP THÊM CLONE VÀO LIST) ---
  const openAddClonesModal = (list) => {
    setTargetList(list);
    setAddCount('3');
    setAddDate(new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
    setAddNote(list.raw_note || '');
    setAddError('');
    setShowAddClonesModal(true);
  };

  const handleAddClonesToList = async (e) => {
    e.preventDefault();
    if (!targetList) return;
    setAddError('');

    const countNum = parseInt(addCount, 10);
    if (!countNum || countNum <= 0) {
      setAddError('Số lượng acc nộp thêm phải lớn hơn 0.');
      return;
    }

    setSubmittingAdd(true);
    try {
      const res = await apiFetch(`/api/admin/clone-lists/${targetList.id}/add-clones`, {
        method: 'POST',
        body: JSON.stringify({
          count: countNum,
          submission_date: addDate,
          raw_note: addNote.trim()
        })
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Cập nhật nộp thêm Clone thất bại');
      }

      setShowAddClonesModal(false);
      await fetchStats();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setSubmittingAdd(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const {
    members,
    today,
    arena,
    kpi,
    donations,
    cloneLists = [],
    memberKPIProgress = [],
    recentDonations = []
  } = data || {};

  const dailyTarget = today?.target || 3;
  const weeklyTarget = kpi?.target || 21;
  const totalActive = members?.active || 1;
  const todayAchieved = today?.achievedCount || 0;
  const todayPercent = Math.min(100, Math.round((todayAchieved / totalActive) * 100));

  const weekAchieved = kpi?.achievedMembers || 0;
  const weekPercent = Math.min(100, Math.round((weekAchieved / (kpi?.totalCloneMembers || totalActive)) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Bảng điều khiển Quản trị CaisBang
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tổng cộng: <b className="text-slate-900">{members?.total || 0} thành viên</b> ({members?.active || 0} đang hoạt động) • Chỉ tiêu: <b className="text-blue-600">3 clone/ngày</b> - <b className="text-blue-600">{weeklyTarget} clone/tuần</b>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openNewListModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>+ Tạo List Clone mới</span>
          </button>

          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold border border-slate-200 transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 4 Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Badge 1: Số thành viên của nhóm */}
        <div
          onClick={() => setActiveTab('admin-members')}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Số thành viên nhóm</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-105 transition">
              <Users size={20} />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900">
                {members?.total || 0}
              </span>
              <span className="text-xs font-semibold text-slate-500">thành viên</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-emerald-600 font-semibold">{members?.active || 0}</span> đang hoạt động
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-medium">
            <span>Quản lý thành viên</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Badge 2: Số tiền quỹ hiện tại */}
        <div
          onClick={() => setActiveTab('admin-donations')}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Số tiền quỹ hiện tại</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:scale-105 transition">
              <Coins size={20} />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatVND(donations?.allTimeConfirmedTotal)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tháng {donations?.month}: <span className="font-semibold text-slate-700">{formatVND(donations?.monthlyConfirmedTotal)}</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-medium">
            <span>+ Cập nhật & Quản lý Quỹ</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Badge 3: Số clone hiện đang chưa leo đấu trường / tổng số clone */}
        <div
          onClick={() => setActiveTab('admin-clones')}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chưa leo / Tổng clone</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 group-hover:scale-105 transition">
              <Swords size={20} />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-amber-600">
                {arena?.unclimbedClones ?? 0}
              </span>
              <span className="text-lg font-bold text-slate-400">/</span>
              <span className="text-2xl font-extrabold text-slate-900">
                {arena?.totalApprovedClones ?? 0}
              </span>
              <span className="text-xs font-semibold text-slate-500">clone</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Đã leo: <span className="text-emerald-600 font-semibold">{arena?.climbedClones ?? 0}</span> clone
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-medium">
            <span>Kho Clone</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Badge 4: Số thành viên chưa nộp clone trong ngày */}
        <div
          onClick={() => setActiveTab('admin-kpi')}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chưa nộp clone hôm nay</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 group-hover:scale-105 transition">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-rose-600">
                {today?.unsubmittedCount ?? 0}
              </span>
              <span className="text-xs font-semibold text-slate-500">thành viên</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Chỉ tiêu 3 clone/ngày • <span className="font-semibold text-emerald-600">{today?.achievedCount ?? 0}</span> đã nộp đủ
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-medium">
            <span>Xem giám sát KPI</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* 2-Column Action & Monitoring Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (7 cols): QUẢN LÝ LIST CLONE */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Gamepad2 size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Quản lý List Clone</h2>
                  <p className="text-xs text-slate-500">Danh sách list clone của các thành viên & nộp thêm clone</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openNewListModal()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>+ Tạo List mới</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-clones')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Kho List Clone</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Danh sách List Clone gần nhất */}
            {cloneLists.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <span className="text-2xl block mb-1">🎮</span>
                <p className="text-sm font-semibold text-slate-700">Chưa có List Clone nào</p>
                <p className="text-xs text-slate-400 mt-0.5">Bấm nút "+ Tạo List mới" ở trên để ghi nhận list clone cho thành viên.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cloneLists.map((list) => (
                  <div
                    key={list.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{list.display_name}</span>
                          {list.game_name && (
                            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                              IGN: {list.game_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-800 border border-slate-300">
                            {list.account_name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Cập nhật: {list.updated_at ? new Date(list.updated_at).toLocaleDateString('vi-VN') : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                          {list.total_count} acc
                        </span>
                        {list.today_added_count > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            +{list.today_added_count} hôm nay
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Note Box with Copy button & Nộp thêm button */}
                    <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-700">
                      <span className="truncate select-all" title={list.raw_note}>
                        {list.raw_note || 'Không có ghi chú'}
                      </span>
                      {list.raw_note && (
                        <button
                          onClick={() => handleCopyNote(list.id, list.raw_note)}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Copy tài khoản & mật khẩu"
                        >
                          {copiedId === list.id ? (
                            <>
                              <Check size={12} className="text-emerald-600" />
                              <span className="text-emerald-600">Đã copy</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Action: Nộp thêm vào list này */}
                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => openAddClonesModal(list)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        title="Nộp thêm clone vào list này"
                      >
                        <Plus size={13} />
                        <span>+ Nộp thêm vào list này</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (5 cols): TIẾN ĐỘ KPI NGÀY & TUẦN + QUỸ */}
        <div className="lg:col-span-5 space-y-6">
          {/* Khối 3: Tiến độ KPI Ngày (3 clone) & Tuần (21 clone) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Award size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tiến độ KPI Ngày & Tuần</h2>
                  <p className="text-xs text-slate-500">Mục tiêu: {dailyTarget} clone/ngày • {weeklyTarget} clone/tuần</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('admin-kpi')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition cursor-pointer"
              >
                <span>Chi tiết KPI</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Overall Today & Week Progress Bars */}
            <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              {/* Today Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">Hôm nay ({today?.date})</span>
                  <span className="text-blue-700 font-bold">
                    {todayAchieved} / {totalActive} thành viên đạt ({todayPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${todayPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Week Bar */}
              <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">Kỳ tuần {kpi?.periodCode}</span>
                  <span className="text-emerald-700 font-bold">
                    {weekAchieved} / {kpi?.totalCloneMembers || totalActive} hoàn thành ({weekPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${weekPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Member Progress List */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tình trạng nộp clone thành viên
                </span>
                <span className="text-[11px] text-slate-400">
                  Chưa nộp hôm nay: <b className="text-rose-600">{today?.unsubmittedCount ?? 0}</b>
                </span>
              </div>

              {memberKPIProgress.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Chưa có thành viên nào.
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {memberKPIProgress.map((m) => {
                    const todayCount = m.today_count || 0;
                    const isTodayAchieved = todayCount >= dailyTarget;
                    const isTodayZero = todayCount === 0;

                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 truncate">{m.display_name}</span>
                            {m.game_name && (
                              <span className="text-[11px] text-slate-400 font-mono">({m.game_name})</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Tuần: <b className="text-slate-700">{m.week_approved_count}</b>/{weeklyTarget}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isTodayAchieved ? (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 size={12} /> Đạt ({todayCount}/{dailyTarget})
                            </span>
                          ) : isTodayZero ? (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <Clock size={12} /> Chưa nộp (0/{dailyTarget})
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <AlertTriangle size={12} /> Thiếu {dailyTarget - todayCount} ({todayCount}/{dailyTarget})
                            </span>
                          )}

                          <button
                            onClick={() => openNewListModal(m.id)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition cursor-pointer"
                            title={`Tạo List Clone mới cho ${m.display_name}`}
                          >
                            + Nhập
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Khối 4: Biến động Quỹ Donate mới nhất */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Coins size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Hoạt động Quỹ gần nhất</h2>
                  <p className="text-xs text-slate-500">Các khoản tiền vừa được Admin cập nhật vào quỹ</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('admin-donations')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition cursor-pointer"
              >
                <span>+ Cập nhật Quỹ</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {recentDonations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <span className="text-2xl block mb-1">🪙</span>
                <p className="text-sm font-semibold text-slate-700">Chưa có khoản đóng góp nào</p>
                <p className="text-xs text-slate-400 mt-0.5">Admin cập nhật tiền quỹ tại tab Donate.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentDonations.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{item.display_name}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5" title={item.note}>
                        {item.note || 'Ủng hộ quỹ Cái Bang'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-extrabold text-emerald-600">
                        +{formatVND(item.amount)}
                      </span>
                      {item.proof_image_path && (
                        <button
                          onClick={() =>
                            setSelectedImage({
                              url: item.proof_image_path.startsWith('http')
                                ? item.proof_image_path
                                : `/uploads/${item.proof_image_path}`,
                              title: `Minh chứng đóng góp - ${item.display_name}`
                            })
                          }
                          className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer"
                          title="Xem ảnh minh chứng"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: TẠO LIST CLONE MỚI (NỘP LIST MỚI TÊN TK KHÁC)
         ========================================================================= */}
      {showNewListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="text-blue-600" size={18} />
                Tạo List Clone mới cho thành viên
              </h3>
              <button
                onClick={() => setShowNewListModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewList} className="p-6 space-y-4">
              {newError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>{newError}</span>
                </div>
              )}

              {/* Chọn thành viên: Chỉ hiển thị tên và ingame, không có 0/3 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                  <User size={13} /> Thành viên nộp Clone <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">-- Chọn thành viên --</option>
                  {memberKPIProgress.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name} {m.game_name ? `(${m.game_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tên tài khoản */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Tên tài khoản (Tên list mới) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Ví dụ: caisbang_bao, longsat..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ngày ghi nhận & Số lượng Clone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                    <Calendar size={13} /> Ngày ghi nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Tự tính vào KPI tuần hiện tại</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Số lượng acc <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-blue-600 font-semibold">Định mức 3/ngày</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={newCount}
                    onChange={(e) => setNewCount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    required
                  />
                </div>
              </div>

              {/* Ghi chú: Nơi admin paste tên tk + stt và mật khẩu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Ghi chú (Tên tài khoản + STT & Mật khẩu)
                </label>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Nhập tên tài khoản, số thứ tự và mật khẩu ở đây...&#10;Ví dụ: caisbang_bao01-03 | pass: 123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewListModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingNew}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingNew ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Lưu List Clone mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CẬP NHẬT LIST CLONE (NỘP THÊM CLONE VÀO LIST ĐÓ)
         ========================================================================= */}
      {showAddClonesModal && targetList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="text-blue-600" size={18} />
                Cập nhật nộp thêm Clone vào List
              </h3>
              <button
                onClick={() => setShowAddClonesModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddClonesToList} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>{addError}</span>
                </div>
              )}

              {/* Thông tin hiện có của List Clone */}
              <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Thành viên:</span>
                  <span className="font-bold text-slate-900">
                    {targetList.display_name} {targetList.game_name ? `(${targetList.game_name})` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tên tài khoản (List):</span>
                  <span className="font-bold font-mono text-blue-800">{targetList.account_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Số acc hiện có trong list:</span>
                  <span className="font-extrabold text-slate-900">{targetList.total_count} acc</span>
                </div>
              </div>

              {/* Số acc nộp thêm & Ngày ghi nhận */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Số acc nộp thêm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={addCount}
                    onChange={(e) => setAddCount(e.target.value)}
                    placeholder="3"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
                    Sau khi nộp: {(targetList.total_count || 0) + (parseInt(addCount, 10) || 0)} acc
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                    <Calendar size={13} /> Ngày ghi nhận (Tự lấy)
                  </label>
                  <input
                    type="date"
                    required
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Tự động cộng KPI hôm nay</span>
                </div>
              </div>

              {/* Ghi chú cập nhật */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Cập nhật ghi chú (Tên tk, STT & Mật khẩu mới)
                </label>
                <textarea
                  rows={4}
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  placeholder="Cập nhật hoặc thêm thông tin nick/mật khẩu mới..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Nội dung ghi chú hiện có được giữ nguyên để bạn dễ dàng bổ sung thêm acc mới.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClonesModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingAdd ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Lưu nộp thêm (+{addCount} acc)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal Preview */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
