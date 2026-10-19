import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  CheckSquare,
  UserCheck,
  LogOut,
  X,
  CalendarClock,
  FileBarChart,
  ChartNoAxesCombined,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const Sidebar = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  pendingDeadlinesCount = 0,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
    { id: 'reports', label: 'Financial Reports', icon: FileBarChart, section: 'Overview' },
    { id: 'analytics', label: 'Financial Analytics', icon: ChartNoAxesCombined, section: 'Overview' },
    { id: 'expenses', label: 'Manage Expenses', icon: Receipt, section: 'Transactions' },
    { id: 'incomes', label: 'Manage Incomes', icon: Wallet, section: 'Transactions' },
    { id: 'bills', label: 'Bills & Subscriptions', icon: CalendarClock, section: 'Transactions' },
    { id: 'recurring', label: 'Recurring Transactions', icon: CalendarClock, section: 'Transactions' },
    { id: 'savings', label: 'Dream Goals & Insights', icon: Wallet, section: 'Planning' },
    {
      id: 'todos',
      label: 'To-Dos & Deadlines',
      icon: CheckSquare,
      section: 'Planning',
      badge: pendingDeadlinesCount > 0
        ? pendingDeadlinesCount > 99
          ? '99+'
          : String(pendingDeadlinesCount)
        : null,
    },
    { id: 'profile', label: 'Profile', icon: UserCheck, section: 'Account' },
  ];

  const sections = ['Overview', 'Transactions', 'Planning', 'Account'];

  const handleNavClick = (tab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const displayName = user?.name || 'Guest User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col bg-white text-slate-800">
      {/* Brand */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-5">
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className="flex min-w-0 items-center gap-3 text-left"
          aria-label="SpendWise home"
        >
          <img
            src="/icon.png"
            alt="SpendWise"
            className="h-10 w-10 shrink-0 rounded-xl object-contain"
          />

          <span className="min-w-0">
            <span className="block text-[17px] font-bold tracking-tight text-slate-950">
              SpendWise
            </span>
            <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
              Personal Finance
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Close menu"
        >
          <X size={19} />
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5"
      >
        {sections.map((section) => {
          const items = navItems.filter((item) => item.section === section);

          return (
            <div key={section}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {section}
              </p>

              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-[13px] font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={`shrink-0 ${
                            isActive
                              ? 'text-sky-600'
                              : 'text-slate-400 transition-colors group-hover:text-slate-700'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>

                      {item.badge && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md bg-rose-50 px-1.5 text-[10px] font-bold text-rose-600 ring-1 ring-inset ring-rose-100">
                          {item.badge}
                        </span>
                      )}

                      {isActive && !item.badge && (
                        <ChevronRight
                          size={15}
                          className="shrink-0 text-sky-500"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User account */}
      <div className="shrink-0 border-t border-slate-100 bg-white p-3">
        <button
          type="button"
          onClick={() => handleNavClick('profile')}
          className={`flex w-full min-w-0 items-center gap-3 rounded-xl p-2.5 text-left transition ${
            currentTab === 'profile'
              ? 'bg-sky-50'
              : 'hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700 ring-1 ring-inset ring-sky-200">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-slate-900">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              @{user?.username || 'user'}
            </p>
          </div>

          <ChevronRight size={16} className="shrink-0 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={logout}
          className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={17} />
          Sign out
        </button>

        <div className="px-3 pb-1 pt-3 text-[10px] font-medium text-slate-400">
          SpendWise · Personal Finance
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-slate-200/80 bg-white lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={onCloseMobile}
          />

          <aside className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col overflow-hidden border-r border-slate-200 bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};