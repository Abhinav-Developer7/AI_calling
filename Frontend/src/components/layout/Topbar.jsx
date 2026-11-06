import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, User, Menu, X, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Topbar({ storeInfo, onToggleMobileMenu, mobileMenuOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Keyboard shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const tagName = document.activeElement?.tagName;
        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/purchases?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Greetings!';
  };

  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-8 py-5 shrink-0 z-10 border-b border-black/[0.04]">
      {/* Left: User Avatar + Friendly Greeting */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation drawer"
          className="md:hidden p-2 rounded-xl bg-surface-muted text-ink hover:text-ink-secondary transition"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 stroke-[1.75]" /> : <Menu className="w-5 h-5 stroke-[1.75]" />}
        </button>

        {/* Circular Avatar with Presence Dot */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-surface-muted border border-black/[0.06] flex items-center justify-center font-bold text-xs text-ink">
            {(user?.name || 'AD').substring(0, 2).toUpperCase()}
          </div>
          <span
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface"
            title="Telephony Engine Active"
            aria-hidden="true"
          />
        </div>

        {/* Greeting & Subtitle */}
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-semibold text-ink tracking-tight flex items-center gap-1.5 truncate">
            <span>{getGreeting()}</span>
          </h1>
          <p className="text-xs text-ink-soft truncate font-normal">
            {storeInfo?.branchName ? `${storeInfo.branchName} · Feedback` : 'Voice AI Feedback Operations'}
          </p>
        </div>
      </div>

      {/* Center: Borderless Pill Search Field */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center relative flex-1 max-w-md mx-4"
      >
        <Search className="w-4 h-4 text-ink-soft absolute left-3.5 pointer-events-none stroke-[1.75]" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customer, bill, or feedback..."
          className="w-full bg-surface-muted hover:bg-black/[0.06] focus:bg-white text-xs text-ink placeholder-ink-soft text-center rounded-pill pl-9.5 pr-9 py-2.5 border border-transparent focus:border-black/10 focus:outline-none transition shadow-none"
        />
        <kbd className="absolute right-3 px-1.5 py-0.5 bg-black/[0.06] text-[10px] text-ink-soft rounded font-mono pointer-events-none">
          /
        </kbd>
      </form>

      {/* Right: Dark Pill "My Account" Menu */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setAccountMenuOpen(!accountMenuOpen)}
          aria-expanded={accountMenuOpen}
          aria-haspopup="true"
          className="flex items-center gap-2 px-3.5 py-2 rounded-pill bg-frame text-white text-xs font-medium hover:bg-frame-dark transition cursor-pointer shadow-sm"
        >
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
            <User className="w-3 h-3 text-accent stroke-[2]" />
          </div>
          <span className="hidden sm:inline font-medium tracking-tight">
            {user?.name ? user.name.split(' ')[0] : 'My account'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-white/70 stroke-[2]" />
        </button>

        {/* Dropdown Menu */}
        {accountMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setAccountMenuOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-surface rounded-2xl shadow-hover border border-black/[0.06] p-2 z-50 text-xs">
              <div className="px-3 py-2.5 border-b border-black/[0.06] mb-1">
                <p className="font-semibold text-ink truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[11px] text-ink-soft truncate mt-0.5">{user?.email || 'admin@aurumjewellery.com'}</p>
                <span className="inline-block px-2 py-0.5 mt-1.5 rounded-full text-[10px] font-semibold bg-status-success-bg text-status-success-ink capitalize">
                  {user?.role || 'Store Manager'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAccountMenuOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-ink hover:bg-surface-muted transition text-left"
              >
                <ShieldCheck className="w-4 h-4 text-ink-soft" />
                <span>Store Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-status-danger-ink hover:bg-status-danger-bg transition text-left mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

