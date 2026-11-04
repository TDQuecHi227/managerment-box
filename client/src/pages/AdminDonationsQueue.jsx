import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Coins,
  CheckCircle2,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Eye,
  Upload,
  Calendar,
  X,
  CreditCard,
  User,
  AlertCircle
} from 'lucide-react';
import ImageModal from '../components/ImageModal';

export default function AdminDonationsQueue() {
  const { apiFetch } = useAuth();
  const [donations, setDonations] = useState([]);
  const [members, setMembers] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [allTimeTotal, setAllTimeTotal] = useState(0);
  const [currentMonth, setCurrentMonth] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Add donation modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Delete modal state
  const [donationToDelete, setDonationToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Zoom image
  const [zoomImageUrl, setZoomImageUrl] = useState(null);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const url = selectedMonth !== 'ALL'
        ? `/api/admin/donations?month=${selectedMonth}`
        : '/api/admin/donations';
      const res = await apiFetch(url);
      if (res.ok) {
        const json = await res.json();
        setDonations(json.donations || []);
        setMonthlyTotal(json.monthlyTotal || 0);
        setAllTimeTotal(json.allTimeTotal || 0);
        setCurrentMonth(json.currentMonth || '');
      }
    } catch (err) {
      console.error('Error fetching donations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await apiFetch('/api/admin/members');
      if (res.ok) {
        const json = await res.json();
        // Sắp xếp đưa thành viên Donate lên đầu, loại bỏ tài khoản Admin
        const list = (json.members || []).filter((m) => m.status === 'ACTIVE' && m.system_role === 'MEMBER');
        list.sort((a, b) => {
          if (a.contribution_type === 'DONATE' && b.contribution_type !== 'DONATE') return -1;
          if (a.contribution_type !== 'DONATE' && b.contribution_type === 'DONATE') return 1;
          return a.display_name.localeCompare(b.display_name);
        });
        setMembers(list);
      }
    } catch (err) {
      console.error('Error fetching members list', err);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [selectedMonth]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const formatRawNumber = (numStr) => {
    const raw = String(numStr).replace(/\D/g, '');
    if (!raw) return '';
    return new Intl.NumberFormat('vi-VN').format(parseInt(raw, 10));
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw);
  };

  const setQuickAmount = (val) => {
    setAmount(String(val));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleOpenAddModal = () => {
    setSelectedUserId(members[0]?.id || '');
    setAmount('');
    setNote('');
    setProofFile(null);
    setPreviewUrl('');
    setFormError('');
    setFormSuccess('');
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedUserId) {
      setFormError('Vui lòng chọn tên thành viên đóng góp.');
      return;
    }

    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      setFormError('Vui lòng nhập số tiền hợp lệ lớn hơn 0 VNĐ.');
      return;
    }

    if (!proofFile) {
      setFormError('Vui lòng tải lên ảnh minh chứng/biên lai chuyển khoản.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('user_id', selectedUserId);
      formData.append('amount', numAmount);
      formData.append('proof', proofFile);
      if (note.trim()) {
        formData.append('note', note.trim());
      }

      const res = await apiFetch('/api/admin/donations', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật Donate thất bại');
      }

      setFormSuccess(data.message || 'Cập nhật Donate thành công!');
      fetchDonations();
      setTimeout(() => {
        setShowAddModal(false);
      }, 1200);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!donationToDelete) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/donations/${donationToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xóa khoản Donate thất bại');
      }
      setDonationToDelete(null);
      fetchDonations();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filter donations by search term
  const filteredDonations = donations.filter((d) => {
    const s = searchTerm.toLowerCase();
    return (
      d.display_name?.toLowerCase().includes(s) ||
      d.game_name?.toLowerCase().includes(s) ||
      d.note?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Coins className="text-amber-500" size={26} />
            Quản lý & Cập nhật Donate (Cái bang)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Admin trực tiếp chọn thành viên, nhập số tiền và tải ảnh biên lai minh chứng để cập nhật vào quỹ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition"
          >
            <Plus size={18} />
            <span>Cập nhật Donate mới</span>
          </button>
          <button
            onClick={fetchDonations}
            title="Làm mới"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quỹ tháng {currentMonth || 'này'}</span>
            <p className="text-2xl font-extrabold text-blue-700 mt-1">{formatVND(monthlyTotal)}</p>
            <span className="text-[11px] text-slate-400">Các khoản trong tháng</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Coins size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quỹ toàn thời gian</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatVND(allTimeTotal)}</p>
            <span className="text-[11px] text-slate-400">Tổng tích lũy box</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lượt ủng hộ đã ghi nhận</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{donations.length}</p>
            <span className="text-[11px] text-slate-400">Giao dịch đã xác nhận</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Thành viên Box</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{members.length}</p>
            <span className="text-[11px] text-slate-400">Đang hoạt động trong box</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <User size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedMonth('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedMonth === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả thời gian
          </button>
          {currentMonth && (
            <button
              onClick={() => setSelectedMonth(currentMonth)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedMonth === currentMonth
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tháng {currentMonth}
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, IGN, ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Table of Donations */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>📋</span> Danh sách đóng góp Donate đã ghi nhận
          </h2>
          <span className="text-xs text-slate-500">
            Hiển thị {filteredDonations.length} / {donations.length} bản ghi
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 mt-2">Đang tải danh sách...</p>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-2">
            <Coins size={36} className="mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">Chưa có bản ghi Donate nào.</p>
            <p className="text-xs text-slate-400">
              Bấm <b>"Cập nhật Donate mới"</b> để thêm đóng góp cho thành viên kèm ảnh minh chứng.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Mã</th>
                  <th className="px-6 py-3.5">Thành viên ủng hộ</th>
                  <th className="px-6 py-3.5">Nick Game (IGN)</th>
                  <th className="px-6 py-3.5">Số tiền</th>
                  <th className="px-6 py-3.5">Ảnh minh chứng</th>
                  <th className="px-6 py-3.5">Ghi chú</th>
                  <th className="px-6 py-3.5">Người cập nhật</th>
                  <th className="px-6 py-3.5">Thời gian</th>
                  <th className="px-6 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      #{item.id}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {item.display_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.display_name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: #{item.user_id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {item.game_name ? (
                        <span className="font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-800 font-semibold">
                          {item.game_name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa đặt</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-bold text-sm text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                        <Coins size={14} className="text-emerald-600" />
                        {formatVND(item.amount)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {item.proof_image_path ? (
                        (() => {
                          const imgUrl = item.proof_image_path.startsWith('http')
                            ? item.proof_image_path
                            : `/uploads/${item.proof_image_path}`;
                          return (
                            <button
                              onClick={() => setZoomImageUrl(imgUrl)}
                              className="group relative inline-block rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:border-blue-500 transition cursor-pointer"
                            >
                              <img
                                src={imgUrl}
                                alt="Minh chứng"
                                className="w-12 h-12 object-cover transition group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                                <Eye size={16} />
                              </div>
                            </button>
                          );
                        })()
                      ) : (
                        <span className="text-xs text-slate-400 italic">Không có ảnh</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 max-w-xs truncate" title={item.note || ''}>
                        {item.note || <span className="text-slate-400 italic">Không có</span>}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {item.reviewer_name || 'Admin'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '—'}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setDonationToDelete(item)}
                        title="Xóa khoản Donate này"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cập Nhật Donate Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Coins size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cập nhật đóng góp Donate
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chọn thành viên, nhập số tiền và tải ảnh biên lai chuyển khoản.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* 1. Chọn Thành Viên */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  1. Chọn thành viên đóng góp <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">-- Chọn thành viên trong danh sách --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name} {m.game_name ? `(IGN: ${m.game_name})` : ''} - [{m.contribution_type === 'DONATE' ? '🪙 Donate tháng' : '🎮 Cày Clone'}]
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Nhập Số Tiền */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  2. Số tiền ủng hộ (VNĐ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="VD: 100.000"
                    value={amount ? formatRawNumber(amount) : ''}
                    onChange={handleAmountChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VNĐ
                  </span>
                </div>

                {/* Quick amount chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50000, 100000, 200000, 500000, 1000000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setQuickAmount(v)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium ${
                        parseInt(amount, 10) === v
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {new Intl.NumberFormat('vi-VN').format(v)}đ
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Tải Ảnh Minh Chứng */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  3. Ảnh minh chứng / Biên lai chuyển khoản <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50/40 transition text-center">
                    <Upload size={22} className="text-blue-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">
                      {proofFile ? proofFile.name : 'Chọn ảnh biên lai (PNG, JPG, WEBP)'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Dung lượng tối đa 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {previewUrl && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Ghi Chú (Tùy Chọn) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  4. Ghi chú giao dịch (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: MBBank, CK ủng hộ sự kiện, v.v."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Lưu & Xác Nhận Donate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {donationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận xóa khoản Donate</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-700">
              <p>Thành viên: <b className="text-slate-900">{donationToDelete.display_name}</b></p>
              <p>Số tiền: <b className="text-emerald-700">{formatVND(donationToDelete.amount)}</b></p>
              <p>Thời gian: {new Date(donationToDelete.created_at).toLocaleString('vi-VN')}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDonationToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-size Image Zoom Modal */}
      {zoomImageUrl && (
        <ImageModal
          isOpen={Boolean(zoomImageUrl)}
          onClose={() => setZoomImageUrl(null)}
          imageUrl={zoomImageUrl}
          title="Minh chứng chuyển khoản Donate"
        />
      )}
    </div>
  );
}
