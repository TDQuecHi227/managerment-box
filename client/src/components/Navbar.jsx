import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const adminTabs = [
    { id: 'admin-dashboard', label: 'Tổng quan' },
    { id: 'admin-clones', label: 'Quản lý Clone' },
    { id: 'admin-arena', label: 'Leo Đấu Trường' },
    { id: 'admin-kpi', label: 'KPI & Lịch sử cày' },
    { id: 'admin-donations', label: 'Donate tháng' },
    { id: 'admin-members', label: 'Quản lý thành viên' }
  ];

  const tabs = adminTabs;

  return (
    <>
      {/* =========================================
          1. DESKTOP SIDEBAR (Bên Trái)
         ========================================= */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 z-30 select-none">
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <h1 className="font-black text-2xl text-slate-900 tracking-tight">
            Cái Bang
          </h1>
        </div>

        {/* Navigation Links (Không có icon) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu điều hướng
          </div>

          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-between ${isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile Card (Dưới cùng Sidebar) */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 m-3 rounded-2xl border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user.display_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                    QUẢN TRỊ VIÊN
                  </span>
                  {user.game_name && (
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {user.game_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================
          2. MOBILE TOP BAR & SLIDE DRAWER (< lg)
         ========================================= */}
      <div className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-40 px-4 h-16 flex items-center justify-between shadow-2xs">
        <div>
          <span className="font-black text-xl text-slate-900 tracking-tight">
            Cái bang
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            ADMIN
          </span>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Slide Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-slideRight">
            <div>
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="font-black text-lg text-slate-900">
                  Cái bang
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-3 space-y-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${isActive
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Profile */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{user.display_name}</p>
                <p className="text-[11px] text-slate-500 font-mono">@{user.username}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 transition"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
