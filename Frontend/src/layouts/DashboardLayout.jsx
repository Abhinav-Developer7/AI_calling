import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  PhoneCall,
  Star,
  AlertCircle,
  BarChart3,
  Settings,
  LogOut,
  Gem,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/purchases', label: 'Purchases', icon: ShoppingBag },
  { path: '/calling', label: 'AI Calling', icon: PhoneCall },
  { path: '/feedback', label: 'Feedback', icon: Star },
  { path: '/complaints', label: 'Complaints', icon: AlertCircle },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-slate-900 text-white shadow-xl">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Gem className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">AURUM JEWELLERY</h1>
            <p className="text-xs text-slate-400">AI Feedback Calling</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[11px] text-slate-400 capitalize">{user?.role || 'Admin'}</p>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Jewellery Customer Feedback System</h2>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Calling Service Active
            </span>
            <span className="text-slate-300">|</span>
            <span>Timezone: Asia/Kolkata (IST)</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

