import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Key, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, apiFetch, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [gameName, setGameName] = useState(user?.game_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const body = {
        display_name: displayName,
        game_name: gameName
      };

      if (newPassword) {
        body.current_password = currentPassword;
        body.new_password = newPassword;
      }

      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật hồ sơ thất bại');
      }

      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      await refreshProfile();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="bg-slate-50 p-6 sm:p-8 border-b border-slate-200 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-xs">
            {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              {user?.display_name}
              {user?.system_role === 'ADMIN' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  ADMIN
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Vai trò: <b className="text-slate-900">{user?.system_role === 'ADMIN' ? 'Quản trị viên (Admin)' : 'Thành viên Box Chat'}</b> • Ngày tham gia: {user?.joined_date || '2026-10-28'}
            </p>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleUpdate} className="p-6 sm:p-8 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl text-sm flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Tài khoản đăng nhập
              </label>
              <input
                type="text"
                disabled
                value={user?.username || ''}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Trạng thái tài khoản
              </label>
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{user?.status === 'ACTIVE' ? 'Đang hoạt động' : user?.status}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tên hiển thị trong Box Chat
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tên trong Game (IGN)
              </label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Nhập nick game..."
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key size={16} className="text-blue-600" />
              Đổi mật khẩu (bỏ trống nếu không muốn đổi)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
