import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  CreditCard,
  Award,
  Save,
  History,
  RefreshCw
} from 'lucide-react';

export default function AdminSettings() {
  const { apiFetch } = useAuth();
  const [kpiTarget, setKpiTarget] = useState(25);
  const [bankName, setBankName] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [qrNote, setQrNote] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, logsRes] = await Promise.all([
        apiFetch('/api/admin/settings'),
        apiFetch('/api/admin/audit-logs')
      ]);

      if (settingsRes.ok && logsRes.ok) {
        const setJson = await settingsRes.json();
        const logsJson = await logsRes.json();

        if (setJson.kpiSetting) {
          setKpiTarget(setJson.kpiSetting.target_value);
        }
        if (setJson.bankInfo) {
          setBankName(setJson.bankInfo.bank_name || '');
          setBankNumber(setJson.bankInfo.bank_account_number || '');
          setBankHolder(setJson.bankInfo.bank_account_holder || '');
          setQrNote(setJson.bankInfo.qr_code_note || '');
        }
        setAuditLogs(logsJson.logs || []);
      }
    } catch (err) {
      console.error('Error fetching settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setSaving(true);

    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          kpi_target: parseInt(kpiTarget, 10),
          bank_name: bankName,
          bank_account_number: bankNumber,
          bank_account_holder: bankHolder,
          qr_code_note: qrNote
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lưu cài đặt thất bại');
      }

      setMsg({ type: 'success', text: 'Cập nhật cấu hình hệ thống thành công!' });
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="text-blue-600" size={24} />
            Cài đặt hệ thống & Nhật ký hoạt động
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cấu hình chỉ tiêu KPI Clone, tài khoản nhận tiền Donate và theo dõi nhật ký hoạt động.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Settings Form */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          {msg.text && (
            <div className={`p-4 rounded-xl text-sm flex items-center gap-2.5 ${
              msg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <span>{msg.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{msg.text}</span>
            </div>
          )}

          {/* Section 1: KPI Config */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award size={18} className="text-blue-600" />
              Chỉ tiêu KPI Clone Tuần
            </h3>
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Số lượng Clone yêu cầu / tuần
              </label>
              <input
                type="number"
                min="1"
                required
                value={kpiTarget}
                onChange={(e) => setKpiTarget(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Chỉ tiêu số lượng Clone tối thiểu yêu cầu cho mỗi thành viên trong một tuần.
              </p>
            </div>
          </div>

          {/* Section 2: Bank Info */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-blue-600" />
              Thông tin nhận tiền Donate của Box
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên Ngân Hàng
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="MB Bank, Techcombank..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Số Tài Khoản
                </label>
                <input
                  type="text"
                  required
                  value={bankNumber}
                  onChange={(e) => setBankNumber(e.target.value)}
                  placeholder="0987654321..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên Chủ Tài Khoản
                </label>
                <input
                  type="text"
                  required
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  placeholder="NGUYEN VAN ADMIN..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Cú pháp nội dung CK
                </label>
                <input
                  type="text"
                  required
                  value={qrNote}
                  onChange={(e) => setQrNote(e.target.value)}
                  placeholder="DONATE [Tên Box]"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Lưu tất cả cấu hình</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History size={18} className="text-blue-600" />
            <span>Nhật ký hoạt động hệ thống</span>
          </h2>
          <span className="text-xs text-slate-500">Gần nhất 100 bản ghi</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-6 py-3">Thời gian</th>
                <th className="px-6 py-3">Người thực hiện</th>
                <th className="px-6 py-3">Hành động</th>
                <th className="px-6 py-3">Đối tượng</th>
                <th className="px-6 py-3">Chi tiết dữ liệu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 font-mono">
                  <td className="px-6 py-2.5 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-6 py-2.5 font-bold text-blue-700">
                    {log.actor_name || 'Hệ thống'}
                  </td>
                  <td className="px-6 py-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-blue-700 font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-2.5 text-slate-500">
                    {log.target_type} #{log.target_id}
                  </td>
                  <td className="px-6 py-2.5 text-slate-700 max-w-md truncate" title={log.details_json}>
                    {log.details_json}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
