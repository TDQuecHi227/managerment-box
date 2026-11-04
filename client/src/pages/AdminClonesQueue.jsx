import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Gamepad2,
  Clock,
  RefreshCw,
  Search,
  Check,
  X,
  PlusCircle,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  User,
  Plus,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function AdminClonesQueue({ setActiveTab }) {
  const { apiFetch } = useAuth();
  const [cloneLists, setCloneLists] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Modal 1: Tạo List Clone mới (khi thành viên nộp list mới có tên tk khác)
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newCount, setNewCount] = useState('3');
  const [newDate, setNewDate] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');
  const [submittingNew, setSubmittingNew] = useState(false);
  const [newError, setNewError] = useState('');

  // Modal 2: Cập nhật List Clone (khi thành viên tiếp tục nộp thêm clone vào list đó)
  const [showAddClonesModal, setShowAddClonesModal] = useState(false);
  const [targetList, setTargetList] = useState(null);
  const [addCount, setAddCount] = useState('3');
  const [addDate, setAddDate] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
  const [addNote, setAddNote] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');

  // Modal 3: Sửa thông tin List Clone
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editTotalCount, setEditTotalCount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchMembers = async () => {
    try {
      const res = await apiFetch('/api/admin/members');
      if (res.ok) {
        const json = await res.json();
        // Chỉ lấy thành viên Cày Clone (thành viên Donate không cày acc)
        setMembersList(
          json.members?.filter(
            (m) => m.status === 'ACTIVE' && m.system_role === 'MEMBER' && (m.contribution_type || 'CLONE') === 'CLONE'
          ) || []
        );
      }
    } catch (err) {
      console.error('Error fetching members list', err);
    }
  };

  const fetchCloneLists = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/clone-lists');
      if (res.ok) {
        const json = await res.json();
        setCloneLists(json.lists || []);
      }
    } catch (err) {
      console.error('Error fetching clone lists', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchCloneLists();
  }, []);

  const handleCopyNote = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- THAO TÁC 1: MỞ FORM TẠO LIST CLONE MỚI ---
  const openNewListModal = (memberId = null) => {
    const defaultUserId = memberId
      ? String(memberId)
      : membersList[0]?.id
        ? String(membersList[0].id)
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
      setNewError('Vui lòng chọn thành viên nộp clone.');
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tạo List Clone mới thất bại');
      }

      setShowNewListModal(false);
      fetchCloneLists();
    } catch (err) {
      setNewError(err.message);
    } finally {
      setSubmittingNew(false);
    }
  };

  // --- THAO TÁC 2: MỞ FORM CẬP NHẬT LIST CLONE (NỘP THÊM CLONE) ---
  const openAddClonesModal = (list) => {
    setTargetList(list);
    setAddCount('3');
    // Ngày tự động lấy hôm nay
    setAddDate(new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
    // Hiển thị ghi chú hiện có để admin sửa/thêm vào
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật nộp thêm Clone thất bại');
      }

      setShowAddClonesModal(false);
      fetchCloneLists();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setSubmittingAdd(false);
    }
  };

  // --- THAO TÁC SỬA / XÓA LIST ---
  const openEditModal = (list) => {
    setEditingList(list);
    setEditAccountName(list.account_name || '');
    setEditTotalCount(String(list.total_count || 0));
    setEditNote(list.raw_note || '');
    setEditError('');
    setShowEditModal(true);
  };

  const handleSaveEditList = async (e) => {
    e.preventDefault();
    if (!editingList) return;
    setEditError('');

    setSubmittingEdit(true);
    try {
      const res = await apiFetch(`/api/admin/clone-lists/${editingList.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          account_name: editAccountName.trim(),
          total_count: parseInt(editTotalCount, 10) || 0,
          raw_note: editNote.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật thông tin thất bại');
      }

      setShowEditModal(false);
      fetchCloneLists();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteList = async (list) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa List Clone "${list.account_name}" (${list.total_count} acc) của ${list.display_name}?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/clone-lists/${list.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCloneLists();
      } else {
        const data = await res.json();
        alert(data.error || 'Không thể xóa');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Lọc theo từ khóa tìm kiếm
  const filteredLists = cloneLists.filter((item) => {
    const s = searchTerm.toLowerCase();
    return (
      item.display_name?.toLowerCase().includes(s) ||
      item.game_name?.toLowerCase().includes(s) ||
      item.account_name?.toLowerCase().includes(s) ||
      item.raw_note?.toLowerCase().includes(s)
    );
  });

  const totalListsCount = filteredLists.length;
  const totalClonesCount = filteredLists.reduce((acc, curr) => acc + (curr.total_count || 0), 0);
  const uniqueMembersCount = new Set(filteredLists.map((l) => l.user_id)).size;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Gamepad2 className="text-blue-600" size={24} />
            Quản Lý List Clone (Cái Bang)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý các list clone của thành viên: cập nhật nộp thêm clone vào list có sẵn hoặc tạo list clone mới.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openNewListModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition cursor-pointer"
          >
            <PlusCircle size={18} />
            <span>+ Tạo List Clone mới</span>
          </button>
          <button
            onClick={fetchCloneLists}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Banner chuyển sang tab Leo Đấu Trường */}
      {setActiveTab && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700 font-bold text-sm">⚔️</span>
            <div>
              <p className="text-xs font-bold text-amber-950">Leo Đấu Trường & Phát Lì Xì Clone đã được tách riêng</p>
              <p className="text-[11px] text-amber-800">Quản lý acc chưa leo, cập nhật ghi chú và tạo danh sách phát lì xì clone theo ngày cho thành viên ở tab riêng.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('admin-arena')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>Mở tab Leo Đấu Trường</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={15} className="text-blue-600" /> Tổng số List Clone
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalListsCount}</span>
            <span className="text-xs font-medium text-slate-500">danh sách</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Mỗi thành viên có thể nộp nhiều list với tên tk khác nhau</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Gamepad2 size={15} className="text-purple-600" /> Tổng Clone tích lũy
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600">{totalClonesCount}</span>
            <span className="text-xs font-medium text-slate-500">acc clone</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đã cộng dồn qua tất cả các đợt nộp vào list</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <User size={15} className="text-emerald-600" /> Thành viên sở hữu list
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{uniqueMembersCount}</span>
            <span className="text-xs font-medium text-slate-500">thành viên</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Thành viên có ít nhất 1 list clone hoạt động</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên thành viên, IGN, tên tài khoản..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs text-slate-500">
          Hiển thị <b className="text-slate-800">{filteredLists.length}</b> list clone
        </div>
      </div>

      {/* Table: Danh Sách List Clone */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Chưa có List Clone nào. Bấm <b>"+ Tạo List Clone mới"</b> ở trên để thêm list đầu tiên.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Thành viên</th>
                  <th className="px-4 py-3.5">Tên tài khoản (List)</th>
                  <th className="px-4 py-3.5">Tổng số acc</th>
                  <th className="px-6 py-3.5">Ghi chú (TK, STT & Pass)</th>
                  <th className="px-4 py-3.5">Cập nhật gần nhất</th>
                  <th className="px-5 py-3.5 text-right">Thao tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLists.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    {/* Thành viên */}
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{item.display_name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-400 font-mono">ID: #{item.user_id}</span>
                          {item.game_name && (
                            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-mono">
                              IGN: {item.game_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tên tài khoản */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-bold font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                        {item.account_name}
                      </span>
                    </td>

                    {/* Tổng số acc */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                          {item.total_count} acc
                        </span>
                        {item.today_added_count > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="Đã nộp thêm hôm nay">
                            +{item.today_added_count} hôm nay
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Ghi chú */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 max-w-md">
                        <span className="truncate select-all" title={item.raw_note}>
                          {item.raw_note || 'Chưa có ghi chú'}
                        </span>
                        {item.raw_note && (
                          <button
                            onClick={() => handleCopyNote(item.id, item.raw_note)}
                            className="px-2 py-1 rounded text-[11px] font-semibold bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Copy toàn bộ tên tk, stt & mật khẩu"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check size={12} className="text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Đã copy</span>
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
                    </td>

                    {/* Cập nhật gần nhất */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                      {item.updated_at ? new Date(item.updated_at).toLocaleDateString('vi-VN') : '—'}
                    </td>

                    {/* Thao tác Admin */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Nút chính: Cập nhật nộp thêm clone vào list này */}
                        <button
                          onClick={() => openAddClonesModal(item)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                          title="Cập nhật list clone khi thành viên nộp thêm clone"
                        >
                          <Plus size={13} />
                          <span>+ Nộp thêm</span>
                        </button>

                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition cursor-pointer"
                          title="Sửa thông tin list clone"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteList(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer"
                          title="Xóa list clone"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: TẠO 1 LIST CLONE MỚI (KHI THÀNH VIÊN NỘP LIST MỚI TÊN TK KHÁC)
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
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{newError}</span>
                </div>
              )}

              {/* Chọn thành viên: Chỉ hiển thị tên và ingame, không có 0/3 */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                  <User size={13} /> Thành viên nộp clone <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">-- Chọn thành viên --</option>
                  {membersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name} {m.game_name ? `(${m.game_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tên tài khoản */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tên tài khoản (Tên list) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Ví dụ: caisbang_bao, longsat, nickmoi..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ngày ghi nhận & Số lượng acc */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                    <Calendar size={13} /> Ngày ghi nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Tự tính vào KPI tuần hiện tại</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Số lượng acc <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-blue-600 font-semibold">Định mức 3/ngày</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCount}
                    onChange={(e) => setNewCount(e.target.value)}
                    placeholder="3"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Ghi chú: Nơi admin paste tên tk + stt và mật khẩu */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ghi chú (Tên tài khoản + STT & Mật khẩu)
                </label>
                <textarea
                  rows="3"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Nhập tên tài khoản, số thứ tự và mật khẩu ở đây...&#10;Ví dụ: caisbang_bao01-03 | pass: 123456"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Sau khi lưu, bạn có thể bấm nút Copy trên danh sách để lấy toàn bộ thông tin này bất kỳ lúc nào.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
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
          MODAL 2: CẬP NHẬT LIST CLONE (KHI THÀNH VIÊN NỘP THÊM CLONE VÀO LIST ĐÓ)
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
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <span>⚠️</span>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Số acc nộp thêm <span className="text-red-500">*</span>
                    </label>
                  </div>
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
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

              {/* Ghi chú: Hiển thị ghi chú hiện có để cập nhật thêm */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Cập nhật ghi chú (Tên tk, STT & Mật khẩu mới)
                </label>
                <textarea
                  rows="4"
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  placeholder="Cập nhật hoặc thêm thông tin nick/mật khẩu mới..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Nội dung ghi chú hiện có được giữ nguyên để bạn dễ dàng bổ sung thêm acc mới.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
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

      {/* =========================================================================
          MODAL 3: SỬA THÔNG TIN LIST CLONE
         ========================================================================= */}
      {showEditModal && editingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="text-blue-600" size={18} />
                Sửa thông tin List Clone
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditList} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{editError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                Thành viên sở hữu: <b>{editingList.display_name}</b> {editingList.game_name ? `(${editingList.game_name})` : ''}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tên tài khoản (Tên list) *
                </label>
                <input
                  type="text"
                  required
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tổng số lượng acc tích lũy *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editTotalCount}
                  onChange={(e) => setEditTotalCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ghi chú (Tên tk, STT & Mật khẩu)
                </label>
                <textarea
                  rows="4"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingEdit ? (
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
