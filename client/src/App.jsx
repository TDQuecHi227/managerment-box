import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminClonesQueue from './pages/AdminClonesQueue';
import AdminArena from './pages/AdminArena';
import AdminDonationsQueue from './pages/AdminDonationsQueue';
import AdminMembers from './pages/AdminMembers';
import AdminKPI from './pages/AdminKPI';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('admin-dashboard');

  useEffect(() => {
    if (user) {
      if (user.system_role === 'ADMIN') {
        setActiveTab('admin-dashboard');
      } else {
        // Only Admin allowed in this portal
        logout();
      }
    }
  }, [user?.system_role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.system_role !== 'ADMIN') {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar Navigation (Bên trái) */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 pb-12">
          {activeTab === 'admin-dashboard' && <AdminDashboard setActiveTab={setActiveTab} />}
          {activeTab === 'admin-clones' && <AdminClonesQueue setActiveTab={setActiveTab} />}
          {activeTab === 'admin-arena' && <AdminArena />}
          {activeTab === 'admin-donations' && <AdminDonationsQueue />}
          {activeTab === 'admin-members' && <AdminMembers />}
          {activeTab === 'admin-kpi' && <AdminKPI />}
        </main>

        {/* Clean Production Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© 2026 Cái bang - Quản lý Thành viên BoxGame</p>
            <p className="text-[11px] text-slate-400">
              Cày Clone 3/ngày, 21/tuần • Quản lý Nộp Clone & Donate tháng
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
