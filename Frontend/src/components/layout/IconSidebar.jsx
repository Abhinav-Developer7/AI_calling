import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  PhoneCall,
  Star,
  AlertCircle,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/purchases', label: 'Purchases', icon: ShoppingBag },
  { path: '/calling', label: 'Calling Queue', icon: PhoneCall },
  { path: '/feedback', label: 'Feedback Records', icon: Star },
  { path: '/complaints', label: 'Complaints', icon: AlertCircle },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function IconSidebar() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      aria-label="Sidebar navigation"
      className="hidden md:flex w-[200px] h-full bg-frame-dark flex-col py-5 px-3 shrink-0 z-20 rounded-[24px] border border-white/5 gap-4"
    >
      {/* Brand Icon Mark - Centered with 1px bottom border */}
      <div className="w-full flex items-center justify-center pb-4 border-b border-white/10 shrink-0">
        <NavLink
          to="/"
          aria-label="Aurum Jewellery Overview"
          className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white font-bold text-base transition group shadow-sm"
        >
          <span className="tracking-tighter font-black text-accent group-hover:scale-105 transition-transform">
            AJ
          </span>
        </NavLink>
      </div>

      {/* Main Navigation Items with Icon + Label */}
      <nav className="w-full flex flex-col gap-1.5 overflow-y-auto" aria-label="Main menu">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 relative cursor-pointer text-xs font-medium ${
                  isActive
                    ? 'bg-frame-active text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Left Active Notch / Indicator */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-accent rounded-r-full"
                      aria-hidden="true"
                    />
                  )}
                  <Icon className="w-4 h-4 stroke-[1.75] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Utility Controls */}
      <div className="w-full flex flex-col gap-1 pt-3 border-t border-white/10 mt-auto shrink-0">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition text-xs font-medium cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 stroke-[1.75] shrink-0" />
          ) : (
            <Moon className="w-4 h-4 stroke-[1.75] shrink-0" />
          )}
          <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={logout}
          aria-label="Log out"
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4 stroke-[1.75] shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
