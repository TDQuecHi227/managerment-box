import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Gift,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

export default function AdminRecipients() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/recipients/summary');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching recipients summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, []);

  const recipients = data?.recipients || [];
  const baseline = data?.baselineClones || 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Gift className="text-blue-600" size={24} />
            Danh sách xét nhận thưởng & Clone vượt mức
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tháng tính: <b className="text-slate-900">{data?.month || '---'}</b> • Định mức cơ bản: <b className="text-blue-600">{baseline} Clone</b>
          </p>
        </div>

        <button
          onClick={fetchRecipients}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Guidelines Box */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 shadow-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
          <ShieldAlert size={17} className="text-blue-600" />
          <span>Chính sách xét thưởng:</span>
        </div>
        <p className="text-xs text-blue-900 leading-relaxed">
          • Thành viên được Admin chỉ định sẽ tham gia tổng hợp số Clone vượt mức trong tháng.<br />
          • Định mức chuẩn là <b>100 Clone / Tháng</b>. Số Clone vượt mức = <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-mono border border-blue-200">max(0, tổng Clone hợp lệ tháng - 100)</code>.<br />
          • Số Clone vượt mức được dùng làm căn cứ xét thưởng hoặc phân phối hỗ trợ từ quỹ Box.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>🎁</span> Danh sách thành viên được chỉ định tháng {data?.month}
          </h2>
          <span className="text-xs text-slate-500">{recipients.length} người được chỉ định</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : recipients.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-2">
            <p>Tháng này chưa có thành viên nào được Admin chỉ định vào danh sách xét nhận thưởng.</p>
            <p className="text-xs text-slate-400">
              Vào mục <b>Thành viên</b> và bật công tắc <b>Xét nhận thưởng</b> cho các thành viên mong muốn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Thành viên</th>
                  <th className="px-6 py-3.5">Nick Game (IGN)</th>
                  <th className="px-6 py-3.5">Người chỉ định</th>
                  <th className="px-6 py-3.5">Clone hợp lệ tháng</th>
                  <th className="px-6 py-3.5">Định mức chuẩn</th>
                  <th className="px-6 py-3.5">Số Clone vượt mức</th>
                  <th className="px-6 py-3.5">Ghi chú đối soát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recipients.map((r) => {
                  const hasExcess = r.excessClones > 0;
                  return (
                    <tr key={r.recipient_id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-slate-900 block">{r.display_name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">ID: #{r.user_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-blue-700">
                        {r.game_name || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {r.assigned_by_name || 'Admin'}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-base">
                        {r.monthlyApprovedClones}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {r.baselineClones}
                      </td>
                      <td className="px-6 py-4">
                        {hasExcess ? (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                            +{r.excessClones} Clone vượt mốc
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">
                            0 (Chưa vượt mốc {r.baselineClones})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs">
                        {hasExcess ? 'Đủ điều kiện xét thưởng' : 'Chưa đạt định mức vượt'}
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
  );
}
