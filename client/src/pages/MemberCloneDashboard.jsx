import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Gamepad2,
  CheckCircle2,
  Clock,
  XCircle,
  Gift,
  PlusCircle,
  RefreshCw,
  Send,
  HelpCircle
} from 'lucide-react';

export default function MemberCloneDashboard({ initialAction }) {
  const { user, apiFetch } = useAuth();
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(initialAction === 'submit');

  // Submit form state
  const [declaredCount, setDeclaredCount] = useState('');
  const [rawNote, setRawNote] = useState('');
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, hisRes] = await Promise.all([
        apiFetch('/api/clones/my-summary'),
        apiFetch('/api/clones/my-history')
      ]);

      if (sumRes.ok && hisRes.ok) {
        const sumData = await sumRes.json();
        const hisData = await hisRes.json();
        setSummary(sumData);
        setHistory(hisData.submissions || []);
      }
    } catch (err) {
      console.error('Error fetching clone data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });
    setSubmitting(true);

    try {
      const res = await apiFetch('/api/clones/submit', {
        method: 'POST',
        body: JSON.stringify({
          declared_count: parseInt(declaredCount, 10),
          raw_note: rawNote
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Nộp danh sách thất bại');
      }

      setFormMsg({ type: 'success', text: data.message });
      setDeclaredCount('');
      setRawNote('');
      fetchData();
      setTimeout(() => {
        setShowSubmitModal(false);
        setFormMsg({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const kpi = summary?.weeklyKPI;
  const isAchieved = kpi?.status === 'ACHIEVED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Xin chào, {user.display_name}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              THÀNH VIÊN BOX
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kỳ tuần: <b className="text-slate-800">{summary?.period?.code}</b> ({summary?.period?.start_date} đến {summary?.period?.end_date})
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition"
          >
            <PlusCircle size={18} />
            <span>Nộp Clone Mới</span>
          </button>
          <button
            onClick={fetchData}
            title="Làm mới"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: KPI Tuần Hiện Tại */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chỉ tiêu KPI Tuần</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              isAchieved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isAchieved ? <CheckCircle2 size={13} /> : <Clock size={13} />}
              {isAchieved ? 'ĐÃ ĐẠT CHỈ TIÊU' : 'ĐANG TIẾN HÀNH'}
            </span>
          </div>

          <div className="space-y-3 my-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                {kpi?.approved_count || 0}
                <span className="text-lg font-normal text-slate-500"> / {kpi?.target || 25}</span>
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {kpi?.progress_percent || 0}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAchieved ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, kpi?.progress_percent || 0)}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Đang chờ duyệt: <b className="text-amber-600">{kpi?.pending_count || 0}</b></span>
            <span>Còn thiếu: <b className="text-slate-800">{kpi?.remaining || 0} Clone</b></span>
          </div>
        </div>

        {/* Card 2: Quy định nộp */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quy định đóng góp</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Gamepad2 size={18} />
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              Chỉ tiêu tuần: <b className="text-slate-900">25 tài khoản/tuần</b>.
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              Có thể nộp nhiều đợt trong tuần (tính dồn tài khoản hợp lệ).
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              Hỗ trợ ghi tắt dạng khoảng: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">baowibu01-10</code>.
            </p>
            <p className="text-[11px] text-slate-400 italic">
              * Tài khoản chỉ tính vào KPI sau khi được duyệt.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            Lịch sử nộp: <b className="text-slate-900">{history.length} lần</b>
          </div>
        </div>

        {/* Card 3: Xét nhận Donate & Clone vượt mức tháng */}
        <div className={`rounded-2xl p-6 shadow-xs flex flex-col justify-between border ${
          summary?.recipientSummary
            ? 'bg-blue-50/40 border-blue-200'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Gift size={14} /> Xét nhận thưởng tháng
            </span>
            {summary?.recipientSummary ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                ĐƯỢC CHỈ ĐỊNH
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                CHƯA CHỈ ĐỊNH
              </span>
            )}
          </div>

          {summary?.recipientSummary ? (
            <div className="space-y-3 my-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-blue-700">
                    {summary.recipientSummary.excessClones}
                  </span>
                  <span className="text-xs text-slate-500 ml-1.5">Clone vượt mốc</span>
                </div>
                <span className="text-xs text-slate-600">
                  Tháng: <b>{summary.recipientSummary.month}</b>
                </span>
              </div>

              <div className="text-xs space-y-1 bg-white p-2.5 rounded-xl border border-blue-100">
                <div className="flex justify-between text-slate-600">
                  <span>Clone đã duyệt tháng:</span>
                  <b className="text-blue-700">{summary.recipientSummary.monthlyApprovedClones}</b>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Định mức cơ bản:</span>
                  <b className="text-slate-900">100 Clone</b>
                </div>
              </div>

              <p className="text-[11px] text-blue-900 leading-tight">
                Số Clone vượt định mức dùng làm căn cứ xét nhận thưởng theo chính sách của Box.
              </p>
            </div>
          ) : (
            <div className="my-auto py-2 text-xs text-slate-500 space-y-2">
              <p>Thành viên Clone được chỉ định sẽ được tổng hợp số Clone vượt mốc 100 tài khoản/tháng.</p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-400">
            Hạn mức chuẩn: 100 Clone/tháng
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>📜</span> Lịch sử nộp danh sách Clone
          </h2>
          <span className="text-xs text-slate-500">{history.length} bản ghi</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Bạn chưa có lần nộp Clone nào. Bấm <b>Nộp Clone Mới</b> để bắt đầu hoàn thành KPI tuần!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Thời gian</th>
                  <th className="px-6 py-3.5">Kỳ tuần</th>
                  <th className="px-6 py-3.5">Khai báo</th>
                  <th className="px-6 py-3.5">Danh sách / Ghi chú</th>
                  <th className="px-6 py-3.5">Đã duyệt</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5">Phản hồi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-blue-700 whitespace-nowrap">
                      {item.period_code || 'Hiện tại'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {item.declared_count}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-blue-700 max-w-xs truncate" title={item.raw_note}>
                      {item.raw_note}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {item.approved_count !== null ? (
                        <span className="text-emerald-600">{item.approved_count}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'APPROVED' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} /> Đã duyệt
                        </span>
                      )}
                      {item.status === 'PARTIALLY_APPROVED' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} /> Duyệt {item.approved_count}/{item.declared_count}
                        </span>
                      )}
                      {item.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                          <Clock size={12} /> Chờ duyệt
                        </span>
                      )}
                      {item.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
                          <XCircle size={12} /> Từ chối
                        </span>
                      )}
                      {['APPROVED', 'PARTIALLY_APPROVED'].includes(item.status) && (
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 ${
                            item.arena_status === 'CLIMBED'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {item.arena_status === 'CLIMBED' ? '⚔️ Đã leo đấu trường' : '⏳ Chưa leo đấu trường'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs">
                      {item.reject_reason || (item.reviewer_name ? `Duyệt bởi: ${item.reviewer_name}` : '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nộp Clone */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gamepad2 className="text-blue-600" size={20} />
                Nộp danh sách tài khoản Clone
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formMsg.text && (
                <div className={`p-3 rounded-xl text-sm flex items-start gap-2.5 ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <span>{formMsg.type === 'success' ? '✅' : '⚠️'}</span>
                  <span>{formMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Số lượng tài khoản nộp *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={declaredCount}
                  onChange={(e) => setDeclaredCount(e.target.value)}
                  placeholder="Ví dụ: 10 hoặc 25"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Danh sách / Ghi chú Clone *
                  </label>
                  <span className="text-[11px] text-blue-600 font-mono font-medium">
                    Hỗ trợ dạng khoảng: baowibu01-10
                  </span>
                </div>
                <textarea
                  rows="4"
                  required
                  value={rawNote}
                  onChange={(e) => setRawNote(e.target.value)}
                  placeholder={`Nhập ghi chú dạng khoảng hoặc danh sách tài khoản:\nVí dụ: baowibu01-10 (pass chung: abc123)\nhoặc nhập từng dòng tài khoản.`}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <HelpCircle size={12} className="text-slate-400" />
                  Hệ thống lưu nguyên văn ghi chú bạn nhập để đối soát.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Gửi phê duyệt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
