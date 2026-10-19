
import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  CheckSquare,
  UserCheck,
  LogOut,
  X,
  CreditCard,
  ShieldCheck,
  PiggyBank,
  CalendarClock,
  FileBarChart,
  ChartNoAxesCombined,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { PWAInstallButton } from './PWAInstallButton.jsx';

export const Sidebar = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  pendingDeadlinesCount = 0,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'Financial Reports', icon: FileBarChart },
    { id: 'bills', label: 'Bills & Subscriptions', icon: CalendarClock },
    { id: 'analytics', label: 'Financial Analytics', icon: ChartNoAxesCombined },
    { id: 'expenses', label: 'Manage Expenses', icon: Receipt },
    { id: 'incomes', label: 'Manage Incomes', icon: Wallet },
    { id: 'savings', label: 'Dream Goals & Insights', icon: PiggyBank },
    { id: 'recurring', label: 'Recurring Transactions', icon: CalendarClock },
    {
      id: 'todos',
      label: 'To-Dos & Deadlines',
      icon: CheckSquare,
      badge: pendingDeadlinesCount > 0
        ? `${pendingDeadlinesCount} Due`
        : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'profile', label: 'Profile', icon: UserCheck },
  ];

  const handleNavClick = (tab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full select-none flex-col border-r border-sky-100 bg-white text-slate-800 shadow-sm">
      <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50/40 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-400 text-white shadow-md shadow-sky-500/30">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900">
                SpendWise
              </span>
              {/* <span className="rounded-md border border-sky-200 bg-sky-100 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-700">
                PWA
              </span> */}
            </div>
            <p className="text-[11px] font-semibold text-sky-600">
              Expense & Income Manager
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-xl p-1.5 text-slate-400 transition hover:bg-sky-50 hover:text-slate-800 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* <div className="px-4 pb-2 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-white p-3">
          <div className="text-xs">
            <p className="font-extrabold text-slate-900">Install App</p>
            <p className="text-[11px] text-slate-500">Offline & home screen</p>
          </div>
          <PWAInstallButton compact />
        </div>
      </div> */}

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-3">
        <div className="px-3 pb-2 pt-1 text-[11px] font-black uppercase tracking-wider text-sky-700">
          Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-3.5 py-3 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'text-slate-600 hover:bg-sky-50/70 hover:text-sky-600'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-sky-500'}`} />
                <span>{item.label}</span>
              </span>

              {item.badge && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  item.badgeColor || 'bg-sky-100 text-sky-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-sky-100 bg-sky-50/30 p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleNavClick('profile')}
            className="group mr-2 flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-sm font-black text-white shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-bold text-slate-900 group-hover:text-sky-600">
                {user?.name || 'Guest User'}
              </p>
              <p className="truncate text-[11px] font-semibold text-sky-600">
                @{user?.username || 'user'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={logout}
            title="Sign out of SpendWise"
            className="cursor-pointer rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-sky-100 hover:bg-white hover:text-rose-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* <div className="mt-3 flex items-center justify-between px-1 text-[10px] font-bold text-slate-400">
          <span className="flex items-center gap-1 text-sky-600">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
            MySQL Ready
          </span>
          <span className="text-sky-600">v1.2.0</span>
        </div> */}
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 z-40 hidden w-68 flex-col lg:flex">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative flex w-full max-w-xs flex-col bg-white shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
