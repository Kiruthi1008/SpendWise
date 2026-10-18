
import React, { useEffect, useState } from 'react';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ExpensesPage } from './pages/ExpensesPage.jsx';
import { IncomesPage } from './pages/IncomesPage.jsx';
import { TodosPage } from './pages/TodosPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { SavingsInsightsPage } from './pages/SavingsInsightsPage.jsx';
import { RecurringTransactionsPage } from './pages/RecurringTransactionsPage.jsx';
import { BillsPage } from './pages/BillsPage.jsx';
import { FinancialReportsPage } from './pages/FinancialReportsPage.jsx';
import { FinancialAnalyticsPage } from './pages/FinancialAnalyticsPage.jsx';

import { PWAInstallButton } from './components/PWAInstallButton.jsx';
import { OfflineIndicator } from './components/OfflineIndicator.jsx';
import { api } from './services/api.js';

import { Menu, CreditCard, Bell, CheckSquare } from 'lucide-react';

const MainApplication = () => {
  const { user, loading } = useAuth();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [openAddExpense, setOpenAddExpense] = useState(false);
  const [openAddIncome, setOpenAddIncome] = useState(false);

  const [todoSummary, setTodoSummary] = useState({
    overdueCount: 0,
    dueTodayCount: 0,
    dueSoonCount: 0,
    urgentPriorityCount: 0,
    totalPending: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchNotificationBadges = async () => {
      if (!user) return;

      try {
        const response = await api.getTodos();

        if (!cancelled && response.success && response.notificationSummary) {
          setTodoSummary(response.notificationSummary);
        }
      } catch (error) {
        console.error('Could not load To-Do notification summary:', error);
      }
    };

    fetchNotificationBadges();

    return () => {
      cancelled = true;
    };
  }, [user, currentTab]);

  const handleSelectTab = (tab) => {
    setCurrentTab(tab);
    setOpenAddExpense(false);
    setOpenAddIncome(false);
  };

  const handleOpenAddExpense = () => {
    setCurrentTab('expenses');
    setOpenAddExpense(true);
    setOpenAddIncome(false);
  };

  const handleOpenAddIncome = () => {
    setCurrentTab('incomes');
    setOpenAddIncome(true);
    setOpenAddExpense(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white text-slate-900">
        <div className="flex h-12 w-12 animate-spin items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-400 p-2 shadow-xl shadow-sky-500/30">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-wider text-sky-700">
          Loading SpendWise...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <OfflineIndicator />
      </>
    );
  }

  const urgentCount =
    (todoSummary.overdueCount || 0) +
    (todoSummary.dueTodayCount || 0);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-50/40 via-white to-sky-50/30 text-slate-900 antialiased lg:flex-row">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        pendingDeadlinesCount={urgentCount}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-68">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sky-100 bg-white/95 px-4 py-3.5 shadow-sm backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-ml-1 cursor-pointer rounded-xl p-2 text-slate-600 hover:bg-sky-50 hover:text-sky-600 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-sky-400 text-white shadow-sm">
                <CreditCard className="h-4 w-4" />
              </div>
              <span className="hidden text-base font-black tracking-tight text-slate-900 sm:inline">
                SpendWise
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentTab('todos')}
              className={`relative cursor-pointer rounded-xl border p-2 transition ${
                urgentCount > 0
                  ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                  : 'border-transparent text-slate-500 hover:bg-sky-50 hover:text-sky-600'
              }`}
              title={`${urgentCount} deadlines due today or overdue`}
            >
              <Bell className="h-5 w-5" />
              {urgentCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white ring-2 ring-white">
                  {urgentCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('todos')}
              className="hidden cursor-pointer items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50/50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 md:flex"
            >
              <CheckSquare className="h-4 w-4 text-sky-500" />
              <span>To-Dos ({todoSummary.totalPending || 0})</span>
            </button>

            <PWAInstallButton compact />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={handleSelectTab}
              onOpenAddExpense={handleOpenAddExpense}
              onOpenAddIncome={handleOpenAddIncome}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesPage
              initialOpenAdd={openAddExpense}
            />
          )}

          {currentTab === 'incomes' && (
            <IncomesPage
              initialOpenAdd={openAddIncome}
            />
          )}

          {currentTab === 'todos' && <TodosPage />}

          {currentTab === 'profile' && <ProfilePage />}

          {currentTab === 'savings' && <SavingsInsightsPage />}

          {currentTab === 'recurring' && <RecurringTransactionsPage />}

          {currentTab === 'bills' && <BillsPage />}

          {currentTab === 'reports' && <FinancialReportsPage />}

          {currentTab === 'analytics' && <FinancialAnalyticsPage />}
        </main>
      </div>

      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApplication />
    </AuthProvider>
  );
}
