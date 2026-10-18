import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart as PieIcon,
  BarChart3,
  Clock,
  ChevronRight,
  Sparkles,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export const DashboardPage = ({
  onNavigate,
  onOpenAddExpense,
  onOpenAddIncome,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [todoSummary, setTodoSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Time filters
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  const fetchStatsAndTodos = async () => {
    try {
      setLoading(true);
      const [statsRes, todoRes] = await Promise.all([
        api.getDashboardStats({
          month: selectedMonth,
          year: selectedYear,
        }),
        api.getTodos(),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (todoRes.success) {
        setTodoSummary(todoRes.notificationSummary);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndTodos();
  }, [selectedMonth, selectedYear]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
};

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Hello, {user?.name?.split(' ')[0] || 'User'} 👋
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-extrabold border border-sky-200">
              <Sparkles className="w-3 h-3 text-sky-500" /> Active
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Personal income and expense overview, cashflow health, and deadline alerts.
          </p>
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-sky-50/60 p-1 rounded-2xl border border-sky-200">
            <Calendar className="w-4 h-4 text-sky-600 ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 py-1.5 pr-2 focus:outline-none cursor-pointer"
            >
              {monthNames.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 py-1.5 pr-2 focus:outline-none cursor-pointer border-l border-sky-200 pl-2"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-extrabold text-xs shadow-xs transition active:scale-95 cursor-pointer"
          >
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <span>Add Expense</span>
          </button>

          <button
            onClick={onOpenAddIncome}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs shadow-md shadow-sky-500/20 transition active:scale-95 cursor-pointer"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* Prominent Deadline Notification Alert */}
      {todoSummary && (todoSummary.overdueCount > 0 || todoSummary.dueTodayCount > 0) && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-sky-100 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Financial Deadline Alert
              </p>
              <p className="text-xs font-bold text-white mt-0.5">
                {todoSummary.overdueCount > 0 && (
                  <span className="underline decoration-white mr-2">
                    🚨 {todoSummary.overdueCount} task{todoSummary.overdueCount > 1 ? 's' : ''} overdue!
                  </span>
                )}
                {todoSummary.dueTodayCount > 0 && (
                  <span>⚡ {todoSummary.dueTodayCount} due today.</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('todos')}
            className="px-4 py-2 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-black text-xs shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Open To-Dos
          </button>
        </div>
      )}

      {/* Primary Financial Metric Cards in White with Sky Blue Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5 group hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Income</span>
            <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(stats?.summary?.totalIncome)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-sky-700 font-bold">
              <span>{stats?.summary?.incomeCount || 0} income streams</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5 group hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(stats?.summary?.totalExpense)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-600 font-bold">
              <span>{stats?.summary?.expenseCount || 0} expenditures</span>
            </div>
          </div>
        </div>

        {/* Net Savings */}
        <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5 group hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Net Savings</span>
            <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black tracking-tight ${
              (stats?.summary?.netBalance || 0) >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}>
              {formatCurrency(stats?.summary?.netBalance)}
            </div>
            <div className="mt-1 text-xs text-sky-700 font-bold">
              {(stats?.summary?.netBalance || 0) >= 0 ? 'Net Surplus' : 'Net Deficit'}
            </div>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5 group hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Savings Rate</span>
            <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats?.summary?.savingsRate || 0}%
            </div>
            <div className="mt-2 w-full bg-sky-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, stats?.summary?.savingsRate || 0))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Income vs Expense Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-500" />
                Monthly Cashflow Comparison
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Historical comparison across the last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-sky-500" />
                <span className="text-slate-600">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-rose-400" />
                <span className="text-slate-600">Expense</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end gap-3 sm:gap-6 pt-6 pb-2 border-b border-sky-100">
            {stats?.monthlyTrend && stats.monthlyTrend.length > 0 ? (
              stats.monthlyTrend.map((m, idx) => {
                const maxVal = Math.max(
                  ...stats.monthlyTrend.map((item) => Math.max(item.income, item.expense)),
                  1000
                );
                const incHeight = Math.min(100, Math.round((m.income / maxVal) * 100));
                const expHeight = Math.min(100, Math.round((m.expense / maxVal) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full pb-1">
                      <div
                        className="w-full max-w-[24px] bg-sky-500 rounded-t-xl transition-all duration-300 group-hover:brightness-110 relative"
                        style={{ height: `${Math.max(incHeight, 4)}%` }}
                        title={`${m.month} Income: ${formatCurrency(m.income)}`}
                      />
                      <div
                        className="w-full max-w-[24px] bg-rose-400 rounded-t-xl transition-all duration-300 group-hover:brightness-110 relative"
                        style={{ height: `${Math.max(expHeight, 4)}%` }}
                        title={`${m.month} Expense: ${formatCurrency(m.expense)}`}
                      />
                    </div>
                    <span className="text-[11px] font-black text-slate-600 mt-2 truncate w-full text-center">
                      {m.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No monthly trend data recorded yet.
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-500">Aggregated from personal records</span>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-sky-600 font-black hover:underline flex items-center gap-1 cursor-pointer"
            >
              Analyze Records <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-sky-500" />
                Expenses by Type
              </h2>
              <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                {monthNames[selectedMonth - 1]}
              </span>
            </div>

            {stats?.expenseByCategory && stats.expenseByCategory.length > 0 ? (
              <div className="space-y-3 mt-4">
                {stats.expenseByCategory.slice(0, 5).map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-bold text-slate-800 truncate max-w-[130px]">
                          {cat.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900">{formatCurrency(cat.amount)}</span>
                        <span className="text-[11px] text-slate-400 ml-1.5">({cat.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          backgroundColor: cat.color || '#0ea5e9',
                          width: `${Math.min(100, Math.max(3, cat.percentage))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <p>No expenses logged for this period.</p>
                <button
                  onClick={onOpenAddExpense}
                  className="mt-3 text-sky-600 font-bold hover:underline cursor-pointer"
                >
                  + Add First Expense
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-sky-100">
            <button
              onClick={() => onNavigate('expenses')}
              className="w-full py-2.5 px-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View All Categories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Income Sources & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Sources Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-600" />
              Income Sources
            </h2>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-100">
              {stats?.incomeBySource?.length || 0} active sources
            </span>
          </div>

          {stats?.incomeBySource && stats.incomeBySource.length > 0 ? (
            <div className="space-y-3 mt-4">
              {stats.incomeBySource.map((src, idx) => (
                <div key={idx} className="p-3 bg-sky-50/40 rounded-2xl border border-sky-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: src.color }}
                      />
                      <span className="text-xs font-bold text-slate-800">{src.name}</span>
                    </div>
                    <span className="text-xs font-black text-sky-700">
                      {formatCurrency(src.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-sky-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        backgroundColor: src.color || '#0284c7',
                        width: `${Math.min(100, Math.max(4, src.percentage))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs">
              <p>No income streams added for this month.</p>
              <button
                onClick={onOpenAddIncome}
                className="mt-2 text-sky-600 font-bold hover:underline cursor-pointer"
              >
                + Record Income
              </button>
            </div>
          )}
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-600" />
              Recent Transactions
            </h2>
            <span className="text-xs text-sky-600 font-bold">Live flow</span>
          </div>

          {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div className="space-y-2.5">
              {stats.recentTransactions.map((tx) => {
                const isInc = tx.type === 'income';
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-sky-50/20 hover:bg-sky-50/60 transition border border-sky-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm ${
                          isInc ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        {isInc ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{tx.title}</p>
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span>{tx.time}</span>
                          {tx.note && <span>• {tx.note.slice(0, 18)}...</span>}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-xs font-black ${
                        isInc ? 'text-sky-600' : 'text-rose-500'
                      }`}
                    >
                      {isInc ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs">
              No transactions recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
