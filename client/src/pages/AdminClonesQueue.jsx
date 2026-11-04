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
  Swords,
  ShieldAlert,
  Send,
  Eye,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';

export default function AdminClonesQueue() {
  const { apiFetch } = useAuth();
  const [cloneLists, setCloneLists] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArena, setFilterArena] = useState('ALL'); // ALL | UNCLIMBED | CLIMBED | HAS_DISTRIBUTION
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedClimbedId, setCopiedClimbedId] = useState(null);

  // Modal 1: Tạo List Clone mới
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newCount, setNewCount] = useState('3');
  const [newDate, setNewDate] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');
  const [submittingNew, setSubmittingNew] = useState(false);
  const [newError, setNewError] = useState('');

  // Modal 2: Cập nhật List Clone (Nộp thêm clone)
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
  const [editUnclimbedCount, setEditUnclimbedCount] = useState('');
  const [editClimbedCount, setEditClimbedCount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editClimbedNote, setEditClimbedNote] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Modal 4: Cập nhật Leo Đấu Trường
  const [showClimbModal, setShowClimbModal] = useState(false);
  const [climbingList, setClimbingList] = useState(null);
  const [climbCount, setClimbCount] = useState('1');
  const [climbDate, setClimbDate] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
  const [climbedNote, setClimbedNote] = useState('');
  const [unclimbedNote, setUnclimbedNote] = useState('');
  const [remainingUnclimbed, setRemainingUnclimbed] = useState(0);
  const [submittingClimb, setSubmittingClimb] = useState(false);
  const [climbError, setClimbError] = useState('');

  // Modal 5: Xem toàn bộ note phát theo ngày
  const [viewingClimbedList, setViewingClimbedList] = useState(null);

  const fetchMembers = async () => {
    try {
      const res = await apiFetch('/api/admin/members');
      if (res.ok) {
        const json = await res.json();
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

  const handleCopyText = (id, text, type = 'RAW') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'RAW') {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedClimbedId(id);
      setTimeout(() => setCopiedClimbedId(null), 2000);
    }
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

  // --- THAO TÁC 2: MỞ FORM CẬP NHẬT NỘP THÊM CLONE VÀO LIST ---
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

  // --- THAO TÁC 3: MỞ FORM CẬP NHẬT LEO ĐẤU TRƯỜNG ---
  const openClimbModal = (list) => {
    setClimbingList(list);
    const unclimbed = list.unclimbed_count !== undefined
      ? list.unclimbed_count
      : Math.max(0, (list.total_count || 0) - (list.climbed_count || 0));
    const defaultClimb = unclimbed > 0 ? (unclimbed >= 3 ? '3' : String(unclimbed)) : '1';
    setClimbCount(defaultClimb);
    setClimbDate(new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0]);
    setClimbedNote('');
    setUnclimbedNote(list.raw_note || '');
    const numClimb = parseInt(defaultClimb, 10) || 0;
    setRemainingUnclimbed(Math.max(0, unclimbed - numClimb));
    setClimbError('');
    setShowClimbModal(true);
  };

  const handleClimbCountChange = (valStr) => {
    setClimbCount(valStr);
    if (!climbingList) return;
    const unclimbed = climbingList.unclimbed_count !== undefined
      ? climbingList.unclimbed_count
      : Math.max(0, (climbingList.total_count || 0) - (climbingList.climbed_count || 0));
    const numClimb = parseInt(valStr, 10) || 0;
    setRemainingUnclimbed(Math.max(0, unclimbed - numClimb));
  };

  const handleClimbSubmit = async (e) => {
    e.preventDefault();
    if (!climbingList) return;
    setClimbError('');

    const countNum = parseInt(climbCount, 10);
    if (!countNum || countNum <= 0) {
      setClimbError('Số lượng acc đã leo phải lớn hơn 0.');
      return;
    }

    setSubmittingClimb(true);
    try {
      const res = await apiFetch(`/api/admin/clone-lists/${climbingList.id}/climb-arena`, {
        method: 'POST',
        body: JSON.stringify({
          climbed_count: countNum,
          remaining_unclimbed: remainingUnclimbed,
          unclimbed_note: unclimbedNote,
          climbed_note: climbedNote,
          climb_date: climbDate
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật leo đấu trường thất bại');
      }

      setShowClimbModal(false);
      fetchCloneLists();
    } catch (err) {
      setClimbError(err.message);
    } finally {
      setSubmittingClimb(false);
    }
  };

  // --- THAO TÁC 4: SỬA / XÓA LIST ---
  const openEditModal = (list) => {
    setEditingList(list);
    setEditAccountName(list.account_name || '');
    setEditTotalCount(String(list.total_count || 0));
    setEditUnclimbedCount(String(list.unclimbed_count !== undefined ? list.unclimbed_count : Math.max(0, (list.total_count || 0) - (list.climbed_count || 0))));
    setEditClimbedCount(String(list.climbed_count || 0));
    setEditNote(list.raw_note || '');
    setEditClimbedNote(list.climbed_note || '');
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
          unclimbed_count: parseInt(editUnclimbedCount, 10) || 0,
          climbed_count: parseInt(editClimbedCount, 10) || 0,
          raw_note: editNote.trim(),
          climbed_note: editClimbedNote.trim()
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

  // Tính toán thống kê tổng thể
  const totalListsCount = cloneLists.length;
  const totalClonesCount = cloneLists.reduce((acc, curr) => acc + (curr.total_count || 0), 0);
  const totalUnclimbedCount = cloneLists.reduce((acc, curr) => {
    const unc = curr.unclimbed_count !== undefined ? curr.unclimbed_count : Math.max(0, (curr.total_count || 0) - (curr.climbed_count || 0));
    return acc + unc;
  }, 0);
  const totalClimbedCount = cloneLists.reduce((acc, curr) => acc + (curr.climbed_count || 0), 0);

  // Lọc theo từ khóa tìm kiếm & tab trạng thái
  const filteredLists = cloneLists.filter((item) => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      item.display_name?.toLowerCase().includes(s) ||
      item.game_name?.toLowerCase().includes(s) ||
      item.account_name?.toLowerCase().includes(s) ||
      item.raw_note?.toLowerCase().includes(s) ||
      item.climbed_note?.toLowerCase().includes(s);

    if (!matchSearch) return false;

    const unc = item.unclimbed_count !== undefined ? item.unclimbed_count : Math.max(0, (item.total_count || 0) - (item.climbed_count || 0));
    if (filterArena === 'UNCLIMBED') return unc > 0;
    if (filterArena === 'CLIMBED') return unc === 0 && (item.climbed_count || 0) > 0;
    if (filterArena === 'HAS_DISTRIBUTION') return Boolean(item.climbed_note && item.climbed_note.trim());

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Gamepad2 className="text-blue-600" size={24} />
            Quản Lý Clone & Leo Đấu Trường
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý các list clone, cập nhật số acc đã leo đấu trường, quản lý acc chưa leo và ghi chú acc đã leo để phát theo ngày.
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

      {/* 4 Metric Cards: Tổng Clone, Chưa Leo, Đã Leo, Số List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={15} className="text-blue-600" /> Tổng số List Clone
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalListsCount}</span>
            <span className="text-xs font-medium text-slate-500">danh sách</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Mỗi thành viên có thể nộp nhiều list khác nhau</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Gamepad2 size={15} className="text-indigo-600" /> Tổng Clone tích lũy
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-600">{totalClonesCount}</span>
            <span className="text-xs font-medium text-slate-500">acc clone</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tổng cộng các lượt nộp của toàn bộ list</p>
        </div>

        {/* Chưa leo Đấu trường */}
        <div
          onClick={() => setFilterArena(filterArena === 'UNCLIMBED' ? 'ALL' : 'UNCLIMBED')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            filterArena === 'UNCLIMBED'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <Swords size={15} /> Chưa leo đấu trường
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{totalUnclimbedCount}</span>
            <span className="text-xs font-medium text-slate-500">acc chờ leo</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cần Admin leo đấu trường để lấy thưởng</p>
        </div>

        {/* Đã leo & Sẵn sàng phát */}
        <div
          onClick={() => setFilterArena(filterArena === 'CLIMBED' ? 'ALL' : 'CLIMBED')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            filterArena === 'CLIMBED'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-300'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={15} /> Đã leo (Sẵn sàng phát)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{totalClimbedCount}</span>
            <span className="text-xs font-medium text-slate-500">acc đã xong</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đã có note để phát thưởng theo ngày</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilterArena('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterArena === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({cloneLists.length})
          </button>
          <button
            onClick={() => setFilterArena('UNCLIMBED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterArena === 'UNCLIMBED'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Còn acc chưa leo
          </button>
          <button
            onClick={() => setFilterArena('CLIMBED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterArena === 'CLIMBED'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Đã leo xong
          </button>
          <button
            onClick={() => setFilterArena('HAS_DISTRIBUTION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterArena === 'HAS_DISTRIBUTION'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Có note phát ngày
          </button>
        </div>

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
      </div>

      {/* Table: Danh Sách List Clone & Leo Đấu Trường */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Chưa có List Clone nào phù hợp với bộ lọc. Bấm <b>"+ Tạo List Clone mới"</b> ở trên để thêm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Thành viên</th>
                  <th className="px-4 py-3.5">Tên tài khoản (List)</th>
                  <th className="px-4 py-3.5">Đấu trường</th>
                  <th className="px-5 py-3.5">Acc chưa leo (STT & Pass)</th>
                  <th className="px-5 py-3.5">Acc đã leo để phát theo ngày</th>
                  <th className="px-5 py-3.5 text-right">Thao tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLists.map((item) => {
                  const unclimbed = item.unclimbed_count !== undefined
                    ? item.unclimbed_count
                    : Math.max(0, (item.total_count || 0) - (item.climbed_count || 0));
                  const climbed = item.climbed_count || 0;

                  return (
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
                        <div>
                          <span className="font-bold font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                            {item.account_name}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-1">
                            Tổng: <b>{item.total_count} acc</b>
                            {item.today_added_count > 0 && (
                              <span className="text-emerald-600 font-bold ml-1">
                                (+{item.today_added_count} hôm nay)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Tiến độ Đấu trường */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border inline-flex items-center gap-1 ${
                              unclimbed > 0
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>
                              <Swords size={12} /> Chưa leo: {unclimbed}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border inline-flex items-center gap-1 ${
                              climbed > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>
                              <CheckCircle2 size={12} /> Đã leo: {climbed}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Ghi chú acc chưa leo */}
                      <td className="px-5 py-4">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 max-w-xs space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acc chưa leo:</span>
                            {item.raw_note && (
                              <button
                                onClick={() => handleCopyText(item.id, item.raw_note, 'RAW')}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition flex items-center gap-1 shrink-0 cursor-pointer"
                                title="Copy danh sách acc chưa leo"
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <Check size={11} className="text-emerald-600" />
                                    <span className="text-emerald-600">Đã copy</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <p className="truncate select-all text-slate-800" title={item.raw_note}>
                            {item.raw_note || <span className="text-slate-400 italic">Không có ghi chú</span>}
                          </p>
                        </div>
                      </td>

                      {/* Ghi chú acc đã leo để phát theo ngày */}
                      <td className="px-5 py-4">
                        {item.climbed_note && item.climbed_note.trim() ? (
                          <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs font-mono text-emerald-900 max-w-xs space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                                <Send size={11} /> Note phát ngày:
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleCopyText(item.id, item.climbed_note, 'CLIMBED')}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition flex items-center gap-1 shrink-0 cursor-pointer"
                                  title="Copy danh sách acc đã leo để phát"
                                >
                                  {copiedClimbedId === item.id ? (
                                    <>
                                      <Check size={11} className="text-emerald-600" />
                                      <span>Đã copy</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Copy phát</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => setViewingClimbedList(item)}
                                  className="p-1 rounded text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                                  title="Xem toàn bộ các ngày"
                                >
                                  <Eye size={13} />
                                </button>
                              </div>
                            </div>
                            <p className="truncate select-all text-emerald-950 font-semibold" title={item.climbed_note}>
                              {item.climbed_note.split('\n')[item.climbed_note.split('\n').length - 1]}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa có acc leo để phát</span>
                        )}
                      </td>

                      {/* Thao tác Admin */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút 1: Leo đấu trường */}
                          <button
                            onClick={() => openClimbModal(item)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                            title="Cập nhật số acc đã leo đấu trường & note phát theo ngày"
                          >
                            <Swords size={13} />
                            <span>Leo ĐT</span>
                          </button>

                          {/* Nút 2: Nộp thêm clone vào list */}
                          <button
                            onClick={() => openAddClonesModal(item)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                            title="Nộp thêm clone vào list này"
                          >
                            <Plus size={13} />
                            <span>+ Nộp thêm</span>
                          </button>

                          {/* Nút Sửa */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition cursor-pointer"
                            title="Sửa thông tin list clone"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Nút Xóa */}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: TẠO 1 LIST CLONE MỚI
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
                  <span className="text-[10px] text-slate-400 mt-1 block">Tự tính vào KPI tuần của ngày đó</span>
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
          MODAL 2: CẬP NHẬT NỘP THÊM CLONE VÀO LIST
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
                  <span className="text-slate-500">Tổng số acc hiện có:</span>
                  <span className="font-extrabold text-slate-900">{targetList.total_count} acc</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                    <Calendar size={13} /> Ngày ghi nhận
                  </label>
                  <input
                    type="date"
                    required
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

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
          MODAL 4: CẬP NHẬT ACC ĐÃ LEO ĐẤU TRƯỜNG & NOTE PHÁT THEO NGÀY
         ========================================================================= */}
      {showClimbModal && climbingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-amber-50 border-b border-amber-200">
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <Swords className="text-amber-600" size={18} />
                <span>Cập nhật Leo Đấu Trường</span>
              </h3>
              <button
                onClick={() => setShowClimbModal(false)}
                className="text-amber-700 hover:text-amber-900 p-1 rounded-lg hover:bg-amber-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleClimbSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {climbError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{climbError}</span>
                </div>
              )}

              {/* Tóm tắt hiện trạng của List */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tài khoản list:</span>
                  <span className="font-bold font-mono text-slate-900">{climbingList.account_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Thành viên:</span>
                  <span className="font-semibold text-slate-900">
                    {climbingList.display_name} {climbingList.game_name ? `(${climbingList.game_name})` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Hiện trạng:</span>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Chưa leo: {climbingList.unclimbed_count !== undefined ? climbingList.unclimbed_count : Math.max(0, (climbingList.total_count || 0) - (climbingList.climbed_count || 0))} acc
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Đã leo: {climbingList.climbed_count || 0} acc
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. Chọn số acc đã leo & Ngày leo/phát */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Số acc đã leo (lần này) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={climbCount}
                    onChange={(e) => handleClimbCountChange(e.target.value)}
                    placeholder="3"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                    <Calendar size={13} /> Ngày leo / phát <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={climbDate}
                    onChange={(e) => setClimbDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* 2. Thêm note acc đã leo để phát theo ngày */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center gap-1">
                  <Send size={13} className="text-emerald-600" />
                  Note các acc đã leo để phát theo ngày <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  value={climbedNote}
                  onChange={(e) => setClimbedNote(e.target.value)}
                  placeholder="Paste danh sách các acc đã leo kèm pass để phát...&#10;Ví dụ: caisbang_bao 1-3 | pass: 123456 (Đã leo rank 1500 phát hôm nay)"
                  className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nội dung này sẽ được lưu kèm theo ngày để bạn bấm nút Copy phát cho thành viên nhanh chóng.
                </span>
              </div>

              {/* 3. Cập nhật số acc chưa leo & ghi chú acc chưa leo còn lại */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cập nhật lại ghi chú acc chưa leo còn lại
                  </label>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Còn lại: {remainingUnclimbed} acc chưa leo
                  </span>
                </div>
                <textarea
                  rows="3"
                  value={unclimbedNote}
                  onChange={(e) => setUnclimbedNote(e.target.value)}
                  placeholder="Sửa lại danh sách các acc chưa leo còn lại...&#10;Ví dụ: caisbang_bao 4-10 | pass: 123456"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Bạn có thể xóa bớt các acc vừa leo xong khỏi ghi chú này.</span>
                  <div className="flex items-center gap-1">
                    <span>Số chưa leo:</span>
                    <input
                      type="number"
                      min="0"
                      value={remainingUnclimbed}
                      onChange={(e) => setRemainingUnclimbed(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-14 px-1.5 py-0.5 border border-slate-300 rounded text-center font-bold text-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClimbModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingClimb}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingClimb ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Lưu cập nhật Leo ĐT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: XEM TOÀN BỘ NOTE PHÁT THEO NGÀY CỦA LIST
         ========================================================================= */}
      {viewingClimbedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-200">
              <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                <Send className="text-emerald-600" size={18} />
                <span>Acc đã leo để phát theo ngày: {viewingClimbedList.account_name}</span>
              </h3>
              <button
                onClick={() => setViewingClimbedList(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Thành viên: <b>{viewingClimbedList.display_name}</b></span>
                <span className="font-bold text-emerald-700">Tổng đã leo: {viewingClimbedList.climbed_count || 0} acc</span>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-y-auto max-h-64 leading-relaxed select-all">
                  {viewingClimbedList.climbed_note || 'Chưa có ghi chú phát nào.'}
                </pre>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleCopyText(viewingClimbedList.id, viewingClimbedList.climbed_note, 'CLIMBED')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedClimbedId === viewingClimbedList.id ? (
                    <>
                      <Check size={14} />
                      <span>Đã copy toàn bộ note</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy toàn bộ note phát</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setViewingClimbedList(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Tổng acc *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editTotalCount}
                    onChange={(e) => setEditTotalCount(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                    Chưa leo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editUnclimbedCount}
                    onChange={(e) => setEditUnclimbedCount(e.target.value)}
                    className="w-full px-2.5 py-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                    Đã leo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editClimbedCount}
                    onChange={(e) => setEditClimbedCount(e.target.value)}
                    className="w-full px-2.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ghi chú acc chưa leo (Tên tk, STT & Pass)
                </label>
                <textarea
                  rows="3"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                  Ghi chú acc đã leo để phát theo ngày
                </label>
                <textarea
                  rows="3"
                  value={editClimbedNote}
                  onChange={(e) => setEditClimbedNote(e.target.value)}
                  placeholder="Ghi chú danh sách acc đã leo phát theo ngày..."
                  className="w-full px-3.5 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl text-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
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
