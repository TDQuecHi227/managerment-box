import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Swords,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Check,
  X,
  Plus,
  PlusCircle,
  Copy,
  Calendar,
  User,
  Edit2,
  Trash2,
  Send,
  Sparkles,
  Layers,
  AlertTriangle
} from 'lucide-react';

export default function AdminArena() {
  const { apiFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: { total_climbed: 0, total_unclimbed: 0, total_distributed: 0, total_lists: 0 },
    unclimbed_lists: [],
    distributions: []
  });

  // State tìm kiếm & bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnclimbedOnly, setFilterUnclimbedOnly] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedDistId, setCopiedDistId] = useState(null);

  // Modal 1: Cập nhật ghi chú & số acc chưa leo (Cột bên trái)
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [editUnclimbedCount, setEditUnclimbedCount] = useState('');
  const [editClimbedCount, setEditClimbedCount] = useState('');
  const [editUnclimbedNote, setEditUnclimbedNote] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Modal 2: Tạo đợt phát lì xì clone theo ngày (Cột bên phải)
  const [showCreateDistModal, setShowCreateDistModal] = useState(false);
  const [distDate, setDistDate] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
  const [distListId, setDistListId] = useState('');
  const [distAccountName, setDistAccountName] = useState('');
  const [distCount, setDistCount] = useState('3');
  const [distNote, setDistNote] = useState('');
  const [distDeduct, setDistDeduct] = useState(true);
  const [submittingDist, setSubmittingDist] = useState(false);
  const [distError, setDistError] = useState('');

  // Modal 3: Sửa đợt phát lì xì
  const [showEditDistModal, setShowEditDistModal] = useState(false);
  const [editingDist, setEditingDist] = useState(null);
  const [editDistDate, setEditDistDate] = useState('');
  const [editDistAccountName, setEditDistAccountName] = useState('');
  const [editDistCount, setEditDistCount] = useState('');
  const [editDistNote, setEditDistNote] = useState('');
  const [submittingEditDist, setSubmittingEditDist] = useState(false);
  const [editDistError, setEditDistError] = useState('');

  const fetchArenaData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/arena');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching arena data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArenaData();
  }, []);

  const handleCopy = (id, text, type = 'LIST') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'LIST') {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedDistId(id);
      setTimeout(() => setCopiedDistId(null), 2000);
    }
  };

  // --- XỬ LÝ CỘT TRÁI: MỞ MODAL CẬP NHẬT ACC CHƯA LEO ---
  const openUpdateModal = (item) => {
    setSelectedList(item);
    const total = item.total_count || 0;
    const climbed = item.climbed_count || 0;
    const unc = item.unclimbed_count !== undefined ? item.unclimbed_count : Math.max(0, total - climbed);
    setEditUnclimbedCount(String(unc));
    setEditClimbedCount(String(climbed));
    setEditUnclimbedNote(item.unclimbed_note || item.raw_note || '');
    setUpdateError('');
    setShowUpdateModal(true);
  };

  // Khi sửa số acc đã leo -> tự động cập nhật số acc chưa leo còn lại!
  const handleClimbedChange = (valStr) => {
    setEditClimbedCount(valStr);
    if (!selectedList) return;
    const total = selectedList.total_count || 0;
    const numClimbed = parseInt(valStr, 10);
    if (!isNaN(numClimbed)) {
      const remainingUnclimbed = Math.max(0, total - numClimbed);
      setEditUnclimbedCount(String(remainingUnclimbed));
    }
  };

  // Khi sửa số acc chưa leo -> tự động cập nhật số acc đã leo!
  const handleUnclimbedChange = (valStr) => {
    setEditUnclimbedCount(valStr);
    if (!selectedList) return;
    const total = selectedList.total_count || 0;
    const numUnclimbed = parseInt(valStr, 10);
    if (!isNaN(numUnclimbed)) {
      const calculatedClimbed = Math.max(0, total - numUnclimbed);
      setEditClimbedCount(String(calculatedClimbed));
    }
  };

  // Nút nhanh: Tăng số acc đã leo thêm +1, +3, +5 acc
  const handleQuickAddClimbed = (amount) => {
    if (!selectedList) return;
    const total = selectedList.total_count || 0;
    const currentClimbed = parseInt(editClimbedCount, 10) || 0;
    const nextClimbed = Math.min(total, currentClimbed + amount);
    const nextUnclimbed = Math.max(0, total - nextClimbed);
    setEditClimbedCount(String(nextClimbed));
    setEditUnclimbedCount(String(nextUnclimbed));
  };

  // Nút nhanh: Đã leo xong tất cả acc trong list (0 chưa leo)
  const handleQuickClimbAll = () => {
    if (!selectedList) return;
    const total = selectedList.total_count || 0;
    setEditClimbedCount(String(total));
    setEditUnclimbedCount('0');
  };

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (!selectedList) return;
    setUpdateError('');

    setSubmittingUpdate(true);
    try {
      const res = await apiFetch(`/api/admin/arena/clone-lists/${selectedList.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          unclimbed_count: parseInt(editUnclimbedCount, 10) || 0,
          climbed_count: parseInt(editClimbedCount, 10) || 0,
          unclimbed_note: editUnclimbedNote
        })
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Cập nhật thất bại.');
      }

      setShowUpdateModal(false);
      await fetchArenaData();
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setSubmittingUpdate(false);
    }
  };

  // --- XỬ LÝ CỘT PHẢI: MỞ MODAL TẠO PHÁT LÌ XÌ THEO NGÀY ---
  const openCreateDistModal = (presetList = null) => {
    setDistDate(new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
    if (presetList) {
      setDistListId(String(presetList.id));
      setDistAccountName(presetList.account_name || '');
      const unc = presetList.unclimbed_count ?? Math.max(0, (presetList.total_count || 0) - (presetList.climbed_count || 0));
      setDistCount(unc > 0 ? (unc >= 3 ? '3' : String(unc)) : '3');
      const noteToUse = presetList.unclimbed_note || presetList.raw_note || '';
      setDistNote(noteToUse ? `[${presetList.account_name}] ${noteToUse}` : '');
    } else {
      setDistListId('');
      setDistAccountName('');
      setDistCount('3');
      setDistNote('');
    }
    setDistDeduct(true);
    setDistError('');
    setShowCreateDistModal(true);
  };

  const handleListSelectChange = (e) => {
    const selectedId = e.target.value;
    setDistListId(selectedId);
    if (!selectedId) {
      setDistAccountName('');
      return;
    }
    const found = data.unclimbed_lists.find((l) => String(l.id) === selectedId);
    if (found) {
      setDistAccountName(found.account_name || '');
      const unc = found.unclimbed_count ?? Math.max(0, (found.total_count || 0) - (found.climbed_count || 0));
      setDistCount(unc > 0 ? (unc >= 3 ? '3' : String(unc)) : '3');
      const noteToUse = found.unclimbed_note || found.raw_note || '';
      if (noteToUse) {
        setDistNote(`[${found.account_name}] ${noteToUse}`);
      }
    }
  };

  const handleCreateDistSubmit = async (e) => {
    e.preventDefault();
    setDistError('');

    const countNum = parseInt(distCount, 10);
    if (!countNum || countNum <= 0) {
      setDistError('Số lượng acc phát lì xì phải lớn hơn 0.');
      return;
    }

    if (!distNote.trim()) {
      setDistError('Vui lòng nhập ghi chú / danh sách acc phát lì xì.');
      return;
    }

    setSubmittingDist(true);
    try {
      const res = await apiFetch('/api/admin/arena/distributions', {
        method: 'POST',
        body: JSON.stringify({
          distribution_date: distDate,
          list_id: distListId ? parseInt(distListId, 10) : null,
          account_name: distAccountName.trim(),
          count: countNum,
          note: distNote.trim(),
          deduct_from_list: distDeduct
        })
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Tạo phát lì xì thất bại.');
      }

      setShowCreateDistModal(false);
      await fetchArenaData();
    } catch (err) {
      setDistError(err.message);
    } finally {
      setSubmittingDist(false);
    }
  };

  // --- XỬ LÝ SỬA / XÓA ĐỢT PHÁT LÌ XÌ ---
  const openEditDistModal = (dist) => {
    setEditingDist(dist);
    setEditDistDate(dist.distribution_date || '');
    setEditDistAccountName(dist.account_name || '');
    setEditDistCount(String(dist.count || 1));
    setEditDistNote(dist.note || '');
    setEditDistError('');
    setShowEditDistModal(true);
  };

  const handleSaveEditDist = async (e) => {
    e.preventDefault();
    if (!editingDist) return;
    setEditDistError('');

    const countNum = parseInt(editDistCount, 10);
    if (!countNum || countNum <= 0) {
      setEditDistError('Số lượng acc phải lớn hơn 0.');
      return;
    }

    setSubmittingEditDist(true);
    try {
      const res = await apiFetch(`/api/admin/arena/distributions/${editingDist.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          distribution_date: editDistDate,
          account_name: editDistAccountName.trim(),
          count: countNum,
          note: editDistNote.trim()
        })
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Cập nhật đợt phát lì xì thất bại.');
      }

      setShowEditDistModal(false);
      await fetchArenaData();
    } catch (err) {
      setEditDistError(err.message);
    } finally {
      setSubmittingEditDist(false);
    }
  };

  const handleDeleteDist = async (dist) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đợt phát lì xì ngày ${dist.distribution_date} (${dist.count} acc)?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/arena/distributions/${dist.id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchArenaData();
      } else {
        const resJson = await res.json();
        alert(resJson.error || 'Không thể xóa');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const { stats, unclimbed_lists = [], distributions = [] } = data;

  // Lọc danh sách bên trái: Chỉ hiển thị các list CÒN ACC CHƯA LEO (> 0)!
  // Hết acc trong list (unclimbed === 0) thì BỎ RA KHỎI DANH SÁCH CHƯA LEO LUÔN!
  const filteredLists = unclimbed_lists.filter((l) => {
    const unclimbed = l.unclimbed_count !== undefined
      ? l.unclimbed_count
      : Math.max(0, (l.total_count || 0) - (l.climbed_count || 0));

    // Bỏ list đã hết acc chưa leo ra khỏi danh sách
    if (unclimbed <= 0) return false;

    const s = searchTerm.toLowerCase();
    if (!s) return true;

    return (
      l.account_name?.toLowerCase().includes(s) ||
      l.display_name?.toLowerCase().includes(s) ||
      l.game_name?.toLowerCase().includes(s) ||
      l.unclimbed_note?.toLowerCase().includes(s) ||
      l.raw_note?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Swords size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Leo Đấu Trường & Phát Lì Xì Clone
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Cập nhật ghi chú và số acc chưa leo, tạo danh sách phát lì xì clone theo ngày cho thành viên
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openCreateDistModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition cursor-pointer"
          >
            <Sparkles size={16} />
            <span>+ Tạo phát lì xì ngày</span>
          </button>
          <button
            onClick={fetchArenaData}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2 BADGES Ở TRÊN: SỐ ACC ĐÃ LEO & SỐ ACC CHƯA LEO
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Badge 1: SỐ ACC ĐÃ LEO */}
        <div className="bg-gradient-to-br from-emerald-50/60 to-white border-2 border-emerald-300 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Số acc đã leo đấu trường
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-emerald-600 tracking-tight">
                {stats.total_climbed ?? 0}
              </span>
              <span className="text-sm font-bold text-emerald-800/70">acc đã leo</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Đã phát lì xì: <b className="text-emerald-700">{stats.total_distributed ?? 0} acc</b> theo ngày
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-100/70 text-emerald-700 border border-emerald-200 hidden sm:block">
            <CheckCircle2 size={36} />
          </div>
        </div>

        {/* Badge 2: SỐ ACC CHƯA LEO */}
        <div className="bg-gradient-to-br from-amber-50/60 to-white border-2 border-amber-300 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <Swords size={16} className="text-amber-600" />
              Số acc chưa leo đấu trường
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-amber-600 tracking-tight">
                {stats.total_unclimbed ?? 0}
              </span>
              <span className="text-sm font-bold text-amber-800/70">acc chờ leo</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Tổng trong kho: <b className="text-slate-800">{(stats.total_climbed ?? 0) + (stats.total_unclimbed ?? 0)} acc</b> ({stats.total_lists ?? 0} list)
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-100/70 text-amber-700 border border-amber-200 hidden sm:block">
            <Swords size={36} />
          </div>
        </div>
      </div>

      {/* =========================================================================
          2 THÔNG TIN BÊN DƯỚI (2 CỘT):
          - BÊN TRÁI: SỐ ACC CHƯA LEO (Kèm nút cập nhật ghi chú acc chưa leo)
          - BÊN PHẢI: SỐ ACC CLONE PHÁT LÌ XÌ THEO NGÀY (Kèm nút tạo, chọn ngày, ghi số list acc phát)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =====================================================================
            CỘT BÊN TRÁI (6/12 cols): SỐ ACC CHƯA LEO
           ===================================================================== */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Header cột trái */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Swords size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Số acc chưa leo
                  </h2>
                  <p className="text-xs text-slate-500">
                    Danh sách các list clone còn acc chưa leo đấu trường
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {filteredLists.length} list còn acc chờ leo
                </span>
              </div>
            </div>

            {/* Ô tìm kiếm nhanh list */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên list, thành viên, IGN hoặc pass..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Danh sách các List Chưa leo */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin inline-block"></div>
              </div>
            ) : filteredLists.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                🎉 Không có list nào có acc chưa leo phù hợp!
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[700px] overflow-y-auto pr-1">
                {filteredLists.map((list) => {
                  const unclimbed = list.unclimbed_count !== undefined
                    ? list.unclimbed_count
                    : Math.max(0, (list.total_count || 0) - (list.climbed_count || 0));

                  return (
                    <div
                      key={list.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-amber-300 transition space-y-3 shadow-xs"
                    >
                      {/* Dòng tiêu đề List: Tên tài khoản, Thành viên, Huy hiệu số lượng */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">
                              {list.account_name}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">{list.display_name}</span>
                            {list.game_name && (
                              <span className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-mono">
                                IGN: {list.game_name}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            Tổng: <b>{list.total_count} acc</b> • Đã leo: <b className="text-emerald-700">{list.climbed_count || 0}</b>
                          </span>
                        </div>

                        {/* Huy hiệu chưa leo to rõ */}
                        <div className="shrink-0 text-right">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                            <Swords size={13} />
                            {unclimbed} chưa leo
                          </span>
                        </div>
                      </div>

                      {/* Box Ghi chú acc chưa leo (STT & Pass) */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-amber-800 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Swords size={12} className="text-amber-600" />
                            Ghi chú acc chưa leo:
                          </span>
                          {(list.unclimbed_note || list.raw_note) && (
                            <button
                              onClick={() => handleCopy(list.id, list.unclimbed_note || list.raw_note, 'LIST')}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Copy ghi chú acc chưa leo"
                            >
                              {copiedId === list.id ? (
                                <>
                                  <Check size={11} className="text-emerald-600" />
                                  <span className="text-emerald-600">Đã copy</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>Copy chưa leo</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-xs font-mono text-slate-800 whitespace-pre-wrap select-all break-words">
                          {list.unclimbed_note || list.raw_note || <span className="text-slate-400 italic">Chưa có ghi chú chưa leo</span>}
                        </p>
                      </div>

                      {/* Ghi chú tài khoản gốc (để xem list đó gồm những acc nào ban đầu) */}
                      {list.raw_note && (
                        <div className="px-2.5 py-1.5 bg-slate-100/80 rounded-lg text-[11px] font-mono text-slate-600 flex items-center justify-between gap-2 border border-slate-200/60">
                          <span className="truncate select-all" title={`Ghi chú tài khoản gốc: ${list.raw_note}`}>
                            <b className="text-slate-500 uppercase tracking-wider text-[10px]">Tài khoản gốc:</b> {list.raw_note}
                          </span>
                        </div>
                      )}

                      {/* Các nút thao tác của List: NÚT CẬP NHẬT (yêu cầu) + Nút phát lì xì nhanh */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => openCreateDistModal(list)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Phát lì xì từ list này"
                        >
                          <Sparkles size={13} />
                          <span>Phát lì xì</span>
                        </button>

                        <button
                          onClick={() => openUpdateModal(list)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                          title="Cập nhật lại ghi chú và số lượng acc chưa leo"
                        >
                          <Edit2 size={13} />
                          <span>Cập nhật</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =====================================================================
            CỘT BÊN PHẢI (6/12 cols): SỐ ACC CLONE PHÁT LÌ XÌ THEO NGÀY
           ===================================================================== */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Header cột phải: Có nút Tạo đợt phát */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Số acc clone phát lì xì theo ngày
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tổng đã phát: <b className="text-emerald-700">{stats.total_distributed ?? 0} acc</b>
                  </p>
                </div>
              </div>

              {/* NÚT TẠO PHÁT LÌ XÌ (yêu cầu) */}
              <button
                onClick={() => openCreateDistModal()}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>+ Tạo phát lì xì</span>
              </button>
            </div>

            {/* Danh sách các đợt phát lì xì theo ngày */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin inline-block"></div>
              </div>
            ) : distributions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                <span className="text-2xl block">🎁</span>
                <p className="font-semibold text-slate-700">Chưa có đợt phát lì xì nào</p>
                <p className="text-slate-400">Bấm nút <b>"+ Tạo phát lì xì"</b> ở trên để tạo danh sách nick phát theo ngày.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[700px] overflow-y-auto pr-1">
                {distributions.map((dist) => {
                  return (
                    <div
                      key={dist.id}
                      className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 transition space-y-3 shadow-xs"
                    >
                      {/* Tiêu đề đợt phát: Ngày + Số lượng acc + Tên list */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-700 text-white flex items-center gap-1 shadow-xs">
                              <Calendar size={12} />
                              Ngày: {dist.distribution_date}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {dist.count} acc phát
                            </span>
                          </div>
                          {dist.account_name && (
                            <span className="text-[11px] text-slate-600 font-mono block">
                              Từ list: <b className="text-emerald-900">{dist.account_name}</b>
                            </span>
                          )}
                        </div>

                        {/* Thao tác: Sửa / Xóa */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditDistModal(dist)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition cursor-pointer"
                            title="Sửa đợt phát lì xì"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteDist(dist)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded transition cursor-pointer"
                            title="Xóa đợt phát lì xì"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Box danh sách nick phát lì xì */}
                      <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Send size={11} className="text-emerald-600" />
                            Danh sách nick lì xì:
                          </span>
                          <button
                            onClick={() => handleCopy(dist.id, dist.note, 'DIST')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Copy danh sách nick lì xì để gửi chat"
                          >
                            {copiedDistId === dist.id ? (
                              <>
                                <Check size={11} />
                                <span>Đã copy phát!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy lì xì</span>
                              </>
                            )}
                          </button>
                        </div>

                        <pre className="text-xs font-mono text-slate-900 whitespace-pre-wrap select-all break-words leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100 max-h-48 overflow-y-auto">
                          {dist.note}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: CẬP NHẬT GHI CHÚ VÀ SỐ ACC CHƯA LEO (BÊN TRÁI)
         ========================================================================= */}
      {showUpdateModal && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-amber-50 border-b border-amber-200">
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <Edit2 className="text-amber-600" size={18} />
                <span>Cập nhật acc chưa leo: {selectedList.account_name}</span>
              </h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-amber-700 hover:text-amber-900 p-1 rounded-lg hover:bg-amber-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="p-6 space-y-4">
              {updateError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{updateError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <div>Thành viên: <b>{selectedList.display_name}</b> {selectedList.game_name ? `(${selectedList.game_name})` : ''}</div>
                <div>Tổng số acc của list: <b>{selectedList.total_count} acc</b></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center justify-between">
                    <span>Số acc đã leo</span>
                    <span className="text-[10px] text-emerald-600 font-semibold font-mono">Tối đa: {selectedList.total_count}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedList.total_count}
                    value={editClimbedCount}
                    onChange={(e) => handleClimbedChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Tự động trừ vào số chưa leo</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-800 mb-1.5 flex items-center justify-between">
                    <span>Chưa leo còn lại *</span>
                    <span className="text-[10px] text-amber-600 font-semibold font-mono">Tự động tính</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedList.total_count}
                    required
                    value={editUnclimbedCount}
                    onChange={(e) => handleUnclimbedChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">= Tổng ({selectedList.total_count}) - Đã leo</span>
                </div>
              </div>

              {/* Phím tắt cập nhật nhanh số acc đã leo */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Phím tắt cập nhật nhanh:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleQuickAddClimbed(1)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                    title="Tăng thêm 1 acc đã leo"
                  >
                    +1 đã leo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddClimbed(3)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                    title="Tăng thêm 3 acc đã leo"
                  >
                    +3 đã leo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddClimbed(5)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                    title="Tăng thêm 5 acc đã leo"
                  >
                    +5 đã leo
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickClimbAll}
                    className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-extrabold transition cursor-pointer shadow-xs"
                    title="Đánh dấu đã leo toàn bộ acc"
                  >
                    ⚔️ Đã leo hết (0 chưa leo)
                  </button>
                </div>
              </div>

              {/* Thông báo khi hết acc chưa leo */}
              {(editUnclimbedCount === '0' || parseInt(editUnclimbedCount, 10) === 0) && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Đã hết acc chưa leo! Khi lưu, list này sẽ tự động được bỏ khỏi danh sách chưa leo.</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Swords size={14} className="text-amber-600" />
                    <span>Ghi chú acc chưa leo (Tên tk, STT & Pass)</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Tách biệt với Ghi chú tài khoản
                  </span>
                </div>
                <textarea
                  rows="4"
                  value={editUnclimbedNote}
                  onChange={(e) => setEditUnclimbedNote(e.target.value)}
                  placeholder="Xóa bớt nick đã leo xong hoặc sửa lại danh sách nick chưa leo..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Chỉ lưu danh sách các tài khoản chưa leo. Ghi chú tài khoản gốc của List sẽ KHÔNG bị thay đổi.
                </span>
              </div>

              {/* Box hiển thị tài khoản gốc của list để Admin tiện đối chiếu/copy */}
              {selectedList?.raw_note && (
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <span>Ghi chú tài khoản gốc (để xem list gồm những acc nào):</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedList.id, selectedList.raw_note, 'ORIGINAL')}
                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === `${selectedList.id}-ORIGINAL` ? (
                        <>
                          <Check size={11} className="text-emerald-600" />
                          <span className="text-emerald-700">Đã copy</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy gốc</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap select-all break-words">
                    {selectedList.raw_note}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingUpdate ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Lưu cập nhật</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: TẠO ĐỢT PHÁT LÌ XÌ CLONE THEO NGÀY (BÊN PHẢI)
         ========================================================================= */}
      {showCreateDistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-200">
              <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                <Sparkles className="text-emerald-600" size={18} />
                <span>Tạo phát lì xì clone theo ngày</span>
              </h3>
              <button
                onClick={() => setShowCreateDistModal(false)}
                className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDistSubmit} className="p-6 space-y-4">
              {distError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{distError}</span>
                </div>
              )}

              {/* 1. Chọn ngày phát lì xì */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                    <Calendar size={13} /> Ngày phát *
                  </label>
                  <input
                    type="date"
                    required
                    value={distDate}
                    onChange={(e) => setDistDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Số lượng acc phát *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={distCount}
                    onChange={(e) => setDistCount(e.target.value)}
                    placeholder="3"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 2. Chọn List Clone (Ghi số list acc sẽ phát) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                  <Layers size={13} /> Chọn List Clone phát lì xì (Tùy chọn)
                </label>
                <select
                  value={distListId}
                  onChange={handleListSelectChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Tự nhập danh sách hoặc chọn List Clone --</option>
                  {unclimbed_lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.account_name} ({l.display_name}) • Còn {l.unclimbed_count ?? l.total_count} chưa leo / {l.total_count} tổng
                    </option>
                  ))}
                </select>
              </div>

              {/* Tên list / Tên nhóm phát */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tên List / Ghi chú nguồn acc
                </label>
                <input
                  type="text"
                  value={distAccountName}
                  onChange={(e) => setDistAccountName(e.target.value)}
                  placeholder="Ví dụ: caisbang_bao, obkk, lì xì đợt 1..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 3. Ghi danh sách acc sẽ phát */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                  Ghi danh sách acc sẽ phát (Tên nick, STT, Mật khẩu) *
                </label>
                <textarea
                  rows="4"
                  required
                  value={distNote}
                  onChange={(e) => setDistNote(e.target.value)}
                  placeholder="Paste danh sách các tài khoản và mật khẩu sẽ phát lì xì ở đây...&#10;Ví dụ:&#10;caisbang_bao01 | pass: 123456&#10;caisbang_bao02 | pass: 123456&#10;caisbang_bao03 | pass: 123456"
                  className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nội dung này sẽ lưu lại để bạn bấm nút Copy gửi lì xì cho thành viên.
                </span>
              </div>

              {/* Checkbox tự động trừ vào list đã chọn */}
              {distListId && (
                <label className="flex items-center gap-2 p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={distDeduct}
                    onChange={(e) => setDistDeduct(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                  />
                  <span>Tự động trừ {distCount} acc vào số chưa leo của list đã chọn</span>
                </label>
              )}

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateDistModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingDist}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingDist ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Lưu đợt phát lì xì</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: SỬA ĐỢT PHÁT LÌ XÌ
         ========================================================================= */}
      {showEditDistModal && editingDist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-200">
              <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                <Edit2 className="text-emerald-600" size={18} />
                <span>Sửa đợt phát lì xì ngày {editingDist.distribution_date}</span>
              </h3>
              <button
                onClick={() => setShowEditDistModal(false)}
                className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditDist} className="p-6 space-y-4">
              {editDistError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{editDistError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Ngày phát *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDistDate}
                    onChange={(e) => setEditDistDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Số lượng acc *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editDistCount}
                    onChange={(e) => setEditDistCount(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tên List / Ghi chú nguồn acc
                </label>
                <input
                  type="text"
                  value={editDistAccountName}
                  onChange={(e) => setEditDistAccountName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                  Ghi danh sách acc phát (Tên nick, STT, Mật khẩu) *
                </label>
                <textarea
                  rows="4"
                  required
                  value={editDistNote}
                  onChange={(e) => setEditDistNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditDistModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingEditDist}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingEditDist ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

