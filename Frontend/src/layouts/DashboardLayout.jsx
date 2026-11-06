import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { IconSidebar } from '../components/layout/IconSidebar';
import { Topbar } from '../components/layout/Topbar';
import { AddPurchaseModal } from '../components/purchases/AddPurchaseModal';
import { apiClient } from '../api/client';
import {
  LayoutDashboard,
  ShoppingBag,
  PhoneCall,
  Star,
  AlertCircle,
  BarChart3,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MOBILE_NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/purchases', label: 'Purchases', icon: ShoppingBag },
  { path: '/calling', label: 'Calling Queue', icon: PhoneCall },
  { path: '/feedback', label: 'Feedback Records', icon: Star },
  { path: '/complaints', label: 'Complaints', icon: AlertCircle },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Aurum Jewellery',
    brandDisplayName: 'Aurum Jewellery',
    branchName: 'Ernakulam Flagship Store',
    callingHoursStart: '10:00',
    callingHoursEnd: '20:00',
  });

  useEffect(() => {
    apiClient
      .get('/settings')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setStoreSettings(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="h-screen bg-frame p-2 sm:p-3 lg:p-4 flex gap-2.5 sm:gap-3.5 lg:gap-4 overflow-hidden font-sans">
      {/* Slim 72px Charcoal Icon-Only Sidebar (Desktop) */}
      <IconSidebar />

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-64 bg-frame-dark p-5 z-50 transform md:hidden transition-transform duration-200 ease-in-out text-white flex flex-col justify-between ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent text-accent-ink font-bold flex items-center justify-center text-xs">
                AJ
              </div>
              <span className="font-semibold text-sm tracking-tight">Aurum Jewellery</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg text-ink-soft hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {MOBILE_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                      isActive
                        ? 'bg-frame-active text-white font-semibold'
                        : 'text-ink-soft hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 stroke-[1.75]" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition mt-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Inset Rounded Canvas */}
      <main className="bg-app rounded-[22px] sm:rounded-[28px] lg:rounded-[32px] flex-1 flex flex-col min-w-0 overflow-hidden shadow-2xl relative h-full">
        {/* Topbar inside canvas */}
        <Topbar
          storeInfo={storeSettings}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          mobileMenuOpen={mobileMenuOpen}
        />

        {/* Scrollable Main Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center py-24 text-ink-soft">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Outlet context={{ setIsPurchaseModalOpen, storeSettings }} />
          </React.Suspense>
        </div>
      </main>

      {/* Global Add Purchase & Call Modal */}
      <AddPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onPurchaseCreated={() => {
          setIsPurchaseModalOpen(false);
          navigate('/purchases');
        }}
      />
    </div>
  );
}
