import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Coins,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  CreditCard,
  Eye,
  Info,
  Calendar,
  Layers,
  Heart
} from 'lucide-react';
import ImageModal from '../components/ImageModal';

export default function MemberDonateDashboard() {
  const { user, apiFetch } = useAuth();
  const [summary, setSummary] = useState(null);
  const [myHistory, setMyHistory] = useState([]);
  const [publicFund, setPublicFund] = useState(null);
  const [activeView, setActiveView] = useState('my'); // 'my' | 'public'
  const [loading, setLoading] = useState(true);
  const [copiedBank, setCopiedBank] = useState(false);

  // Selected image for zoom modal
  const [zoomImageUrl, setZoomImageUrl] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, hisRes, pubRes] = await Promise.all([
        apiFetch('/api/donations/my-summary'),
        apiFetch('/api/donations/my-history'),
        apiFetch('/api/donations/public-fund')
      ]);

      if (sumRes.ok && hisRes.ok) {
        const sumData = await sumRes.json();
        const hisData = await hisRes.json();
        setSummary(sumData);
        setMyHistory(hisData.submissions || []);
      }

      if (pubRes.ok) {
        const pubData = await pubRes.json();
        setPublicFund(pubData);
      }
    } catch (err) {
      console.error('Error fetching donation data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyAccount = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const bank = summary?.bankInfo || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Quỹ Box Chat & Lịch Sử Đóng Góp
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Heart size={12} className="fill-amber-500" /> TỰ NGUYỆN
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Đóng góp ủng hộ duy trì box chat. Admin trực tiếp ghi nhận số tiền và bằng chứng chuyển khoản.
          </p>
        </div>

        <button
          onClick={fetchData}
          title="Làm mới dữ liệu"
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Bank Transfer Guide Box */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-200 border border-blue-400/30">
              <CreditCard size={14} /> Thông tin chuyển khoản ủng hộ Box
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Ủng hộ quỹ duy trì hoạt động & sự kiện Box
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Vui lòng chuyển khoản theo thông tin ngân hàng bên cạnh (với nội dung là <b>Tên hiển thị</b> hoặc <b>IGN</b> của bạn). Sau khi chuyển, bạn chỉ cần gửi ảnh biên lai cho Admin để được cập nhật lên hệ thống.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-xl text-xs space-y-2.5 w-full md:w-80 shrink-0">
            <div>
              <span className="text-slate-400 block text-[11px]">Ngân hàng</span>
              <span className="font-bold text-white text-sm">{bank.bank_name || 'MB Bank'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Số tài khoản</span>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="font-mono font-bold text-amber-300 text-base">
                  {bank.bank_account_number || '0987654321'}
                </span>
                <button
                  onClick={() => handleCopyAccount(bank.bank_account_number || '0987654321')}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 text-[11px]"
                >
                  {copiedBank ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedBank ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Chủ tài khoản</span>
              <span className="font-semibold text-white uppercase">{bank.bank_account_holder || 'ADMIN BOX'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Nội dung CK mẫu</span>
              <span className="font-mono text-blue-200">{bank.qr_code_note || 'DONATE'} - {user.game_name || user.display_name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đóng góp của bạn (Tháng {summary?.month})</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{formatVND(summary?.monthlyApprovedTotal)}</p>
          <span className="text-xs text-slate-400">{summary?.monthlyApprovedCount || 0} lượt đóng góp tháng này</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đóng góp của bạn (Toàn thời gian)</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatVND(summary?.allTimeApprovedTotal)}</p>
          <span className="text-xs text-slate-400">{summary?.allTimeApprovedCount || 0} lượt đã được Admin ghi nhận</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng quỹ Box Chat (Toàn bộ)</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{formatVND(publicFund?.allTimeTotal)}</p>
          <span className="text-xs text-slate-400">Tháng này: {formatVND(publicFund?.monthlyTotal)}</span>
        </div>
      </div>

      {/* Tabs Switcher: Đóng góp của bạn vs Sao kê toàn box */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveView('my')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeView === 'my'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Coins size={15} />
          <span>Lịch sử đóng góp của bạn ({myHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveView('public')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeView === 'public'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers size={15} />
          <span>Sao kê minh bạch toàn Box ({publicFund?.donations?.length || 0})</span>
        </button>
      </div>

      {/* Active Tab Content */}
      {activeView === 'my' ? (
        /* My History */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>💖</span> Đóng góp cá nhân được Admin cập nhật
            </h2>
            <span className="text-xs text-slate-500">{myHistory.length} giao dịch</span>
          </div>

          {myHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm space-y-2">
              <Coins size={36} className="mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700">Bạn chưa có khoản đóng góp nào được ghi nhận.</p>
              <p className="text-xs text-slate-400">
                Sau khi chuyển khoản, hãy nhắn tin và gửi ảnh biên lai cho Admin để được cập nhật nhé!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Mã GD</th>
                    <th className="px-6 py-3.5">Số tiền ủng hộ</th>
                    <th className="px-6 py-3.5">Ảnh minh chứng</th>
                    <th className="px-6 py-3.5">Ghi chú</th>
                    <th className="px-6 py-3.5">Người cập nhật</th>
                    <th className="px-6 py-3.5">Thời gian</th>
                    <th className="px-6 py-3.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        #{item.id}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-800 text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          {formatVND(item.amount)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {item.proof_image_path ? (
                          <button
                            onClick={() => setZoomImageUrl(`/uploads/${item.proof_image_path}`)}
                            className="group relative inline-block rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:border-blue-500 transition"
                          >
                            <img
                              src={`/uploads/${item.proof_image_path}`}
                              alt="Minh chứng"
                              className="w-12 h-12 object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                              <Eye size={16} />
                            </div>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Không có</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-600">
                        {item.note || <span className="text-slate-400 italic">Ủng hộ quỹ</span>}
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {item.reviewer_name || 'Admin'}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '—'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 size={13} /> Đã xác nhận
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Public Box Fund Transparency */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🌟</span> Bảng sao kê minh bạch quỹ Box Chat
            </h2>
            <span className="text-xs text-slate-500">Toàn bộ thành viên đóng góp</span>
          </div>

          {!publicFund?.donations || publicFund.donations.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Chưa có dữ liệu đóng góp công khai.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Mã</th>
                    <th className="px-6 py-3.5">Thành viên</th>
                    <th className="px-6 py-3.5">Nick Game (IGN)</th>
                    <th className="px-6 py-3.5">Số tiền</th>
                    <th className="px-6 py-3.5">Minh chứng</th>
                    <th className="px-6 py-3.5">Ghi chú</th>
                    <th className="px-6 py-3.5">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {publicFund.donations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        #{item.id}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {item.display_name}
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-blue-700">
                        {item.game_name || '—'}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-800 text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          {formatVND(item.amount)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {item.proof_image_path ? (
                          <button
                            onClick={() => setZoomImageUrl(`/uploads/${item.proof_image_path}`)}
                            className="group relative inline-block rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:border-blue-500 transition"
                          >
                            <img
                              src={`/uploads/${item.proof_image_path}`}
                              alt="Minh chứng"
                              className="w-10 h-10 object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                              <Eye size={14} />
                            </div>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-600">
                        {item.note || 'Ủng hộ quỹ'}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Image Zoom Modal */}
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
