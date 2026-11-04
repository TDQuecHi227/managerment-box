import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Edit,
  Gamepad2,
  Coins,
  RefreshCw,
  Search,
  ShieldAlert,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';

export default function AdminMembers() {
  const { apiFetch } = useAuth();
  const [members, setMembers] = useState([]);
  const [filterType, setFilterType] = useState('ALL'); // ALL | CLONE | DONATE
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Create member modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newGameName, setNewGameName] = useState('');
  const [newContributionType, setNewContributionType] = useState('CLONE');
  const [createMsg, setCreateMsg] = useState({ type: '', text: '' });
  const [creating, setCreating] = useState(false);

  // Edit member modal
  const [editingMember, setEditingMember] = useState(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editGameName, setEditGameName] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editContributionType, setEditContributionType] = useState('CLONE');
  const [editMsg, setEditMsg] = useState({ type: '', text: '' });
  const [updating, setUpdating] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/members');
      if (res.ok) {
        const json = await res.json();
        setMembers(json.members || []);
      }
    } catch (err) {
      console.error('Error fetching members', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateMsg({ type: '', text: '' });
    setCreating(true);

    try {
      const res = await apiFetch('/api/admin/members', {
        method: 'POST',
        body: JSON.stringify({
          display_name: newDisplayName,
          game_name: newGameName,
          contribution_type: newContributionType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tạo thành viên thất bại');
      }

      setCreateMsg({ type: 'success', text: 'Thêm thành viên mới thành công!' });
      setNewDisplayName('');
      setNewGameName('');
      setNewContributionType('CLONE');
      fetchMembers();
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateMsg({ type: '', text: '' });
      }, 1200);
    } catch (err) {
      setCreateMsg({ type: 'error', text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setEditDisplayName(member.display_name);
    setEditGameName(member.game_name || '');
    setEditStatus(member.status);
    setEditContributionType(member.contribution_type || 'CLONE');
    setEditMsg({ type: '', text: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingMember) return;

    setEditMsg({ type: '', text: '' });
    setUpdating(true);

    try {
      const res = await apiFetch(`/api/admin/members/${editingMember.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          display_name: editDisplayName,
          game_name: editGameName,
          status: editStatus,
          contribution_type: editContributionType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật thất bại');
      }

      setEditMsg({ type: 'success', text: 'Cập nhật thành công!' });
      fetchMembers();
      setTimeout(() => {
        setEditingMember(null);
        setEditMsg({ type: '', text: '' });
      }, 1000);
    } catch (err) {
      setEditMsg({ type: 'error', text: err.message });
    } finally {
      setUpdating(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      m.display_name?.toLowerCase().includes(s) ||
      m.game_name?.toLowerCase().includes(s) ||
      m.username?.toLowerCase().includes(s);

    if (!matchSearch) return false;

    if (filterType === 'CLONE') {
      return m.system_role === 'MEMBER' && (m.contribution_type || 'CLONE') === 'CLONE';
    }
    if (filterType === 'DONATE') {
      return m.contribution_type === 'DONATE';
    }
    return true;
  });

  const cloneCount = members.filter((m) => m.system_role === 'MEMBER' && (m.contribution_type || 'CLONE') === 'CLONE').length;
  const donateCount = members.filter((m) => m.system_role === 'MEMBER' && m.contribution_type === 'DONATE').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            Quản Lý Thành Viên CaisBang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            2 hình thức quản lý: Thành viên nộp clone hàng ngày (3 acc/ngày, 21 acc/tuần) và Thành viên donate tháng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition cursor-pointer"
          >
            <UserPlus size={18} />
            <span>Thêm Thành Viên</span>
          </button>
          <button
            onClick={fetchMembers}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* 2 Metric Cards: 2 Hình Thức Quản Lý */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setFilterType(filterType === 'CLONE' ? 'ALL' : 'CLONE')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            filterType === 'CLONE'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-300'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Gamepad2 size={16} /> Thành viên Cày Clone hàng ngày
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
              3 acc/ngày • 21 acc/tuần
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-700">{cloneCount}</span>
            <span className="text-xs font-medium text-slate-500">thành viên nộp clone</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Admin nhập danh sách tài khoản theo tin nhắn, giám sát KPI ngày & tuần.</p>
        </div>

        <div
          onClick={() => setFilterType(filterType === 'DONATE' ? 'ALL' : 'DONATE')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            filterType === 'DONATE'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Coins size={16} /> Thành viên Donate tháng
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
              Đóng góp quỹ tháng
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">{donateCount}</span>
            <span className="text-xs font-medium text-slate-500">thành viên ủng hộ</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Admin nhận tin nhắn, nhập số tiền và tải ảnh minh chứng chuyển khoản.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({members.length})
          </button>
          <button
            onClick={() => setFilterType('CLONE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterType === 'CLONE'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Cày Clone ({cloneCount})
          </button>
          <button
            onClick={() => setFilterType('DONATE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterType === 'DONATE'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Donate Tháng ({donateCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, tài khoản, IGN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Thành viên</th>
                <th className="px-4 py-3.5">Nick Game (IGN)</th>
                <th className="px-4 py-3.5">Hình thức tham gia</th>
                <th className="px-4 py-3.5">Vai trò</th>
                <th className="px-5 py-3.5">Đóng góp tổng thể</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((m) => {
                const isClone = (m.contribution_type || 'CLONE') === 'CLONE';

                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{m.display_name}</span>
                        {m.system_role === 'ADMIN' ? (
                          <span className="text-xs text-purple-600 font-mono">@{m.username}</span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">ID: #{m.id}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-mono text-xs text-blue-700 font-semibold">
                      {m.game_name || <span className="text-slate-400 italic font-normal">Chưa đặt</span>}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {m.system_role === 'ADMIN' ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                          <ShieldAlert size={13} /> Quản trị Box
                        </span>
                      ) : m.contribution_type === 'DONATE' ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                          <Coins size={13} /> Donate Tháng
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                          <Gamepad2 size={13} /> Cày Clone
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {m.system_role === 'ADMIN' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit">
                          <ShieldAlert size={12} /> ADMIN
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          MEMBER
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {m.system_role === 'ADMIN' ? (
                        <span className="text-slate-400 text-xs italic font-mono">—</span>
                      ) : m.contribution_type === 'DONATE' ? (
                        <span className="font-bold text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
                          <Coins size={13} className="text-emerald-600" /> Đã donate: {formatVND(m.total_donated)}
                        </span>
                      ) : (
                        <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-flex items-center gap-1">
                          <Gamepad2 size={13} /> Đã cày: {m.total_clones || 0} acc
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {m.status === 'ACTIVE' && (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Hoạt động
                        </span>
                      )}
                      {m.status === 'INACTIVE' && (
                        <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Tạm khóa
                        </span>
                      )}
                      {m.status === 'LEFT' && (
                        <span className="text-xs text-red-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Đã rời box
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(m)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit size={13} />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tạo thành viên mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-md w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="text-blue-600" size={18} />
                Thêm thành viên mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createMsg.text && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    createMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <span>{createMsg.type === 'success' ? '✅' : '⚠️'}</span>
                  <span>{createMsg.text}</span>
                </div>
              )}

              {/* Hình thức quản lý */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Hình thức quản lý thành viên *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewContributionType('CLONE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      newContributionType === 'CLONE'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Gamepad2 size={14} /> Cày Clone
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewContributionType('DONATE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      newContributionType === 'DONATE'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Coins size={14} /> Donate Tháng
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {newContributionType === 'CLONE'
                    ? 'Chỉ tiêu: 3 acc/ngày, 21 acc/tuần'
                    : 'Thành viên donate quỹ tháng (không cày acc)'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tên hiển thị / Biệt danh *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nam Pro, Tuấn..."
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tên trong Game (IGN)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: ProGamer_99..."
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Đang tạo...' : 'Tạo thành viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sửa thành viên */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-md w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="text-blue-600" size={18} />
                Sửa thành viên: {editingMember.display_name}
              </h3>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {editMsg.text && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    editMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <span>{editMsg.type === 'success' ? '✅' : '⚠️'}</span>
                  <span>{editMsg.text}</span>
                </div>
              )}

              {/* Đổi hình thức quản lý (chỉ áp dụng cho MEMBER) */}
              {editingMember.system_role === 'MEMBER' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Hình thức quản lý thành viên *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditContributionType('CLONE')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        editContributionType === 'CLONE'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Gamepad2 size={14} /> Cày Clone
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditContributionType('DONATE')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        editContributionType === 'DONATE'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Coins size={14} /> Donate Tháng
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {editContributionType === 'CLONE'
                      ? 'Chỉ tiêu: 3 acc/ngày, 21 acc/tuần'
                      : 'Thành viên donate quỹ tháng (không cày acc)'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tên hiển thị *
                </label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tên trong Game (IGN)
                </label>
                <input
                  type="text"
                  value={editGameName}
                  onChange={(e) => setEditGameName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Trạng thái tài khoản
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ACTIVE">Hoạt động bình thường</option>
                  <option value="INACTIVE">Tạm khóa tài khoản</option>
                  <option value="LEFT">Đã rời box</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
