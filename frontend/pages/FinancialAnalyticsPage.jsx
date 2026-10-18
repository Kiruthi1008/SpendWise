
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChartNoAxesCombined,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  PiggyBank,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
} from 'lucide-react';
import { api } from '../services/api.js';

const now = new Date();
const initialMonth = `${now.getFullYear()}-${String(
  now.getMonth() + 1
).padStart(2, '0')}`;

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const getMonthName = (month) =>
  new Date(`${month}-01T12:00:00`).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });

const getPreviousMonth = (month) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 2, 1);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
};

const getLastSixMonths = (selectedMonth) => {
  const [year, month] = selectedMonth.split('-').map(Number);

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(year, month - 1 - (5 - index), 1);

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}`;
  });
};

const transactionMonth = (item) =>
  typeof item.date === 'string' ? item.date.slice(0, 7) : '';

const transactionAmount = (item) => Number(item.amount) || 0;

const categoryName = (item) =>
  item.category_name ||
  item.category?.name ||
  item.category ||
  'Uncategorized';

function StatCard({ title, value, detail, icon: Icon, tone = 'sky' }) {
  const tones = {
    sky: 'bg-sky-50 text-sky-600',
    green: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500">{title}</p>
          <p className="mt-2 break-words text-2xl font-black tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span className={`rounded-xl p-3 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      {detail && (
        <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
      )}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export const FinancialAnalyticsPage = () => {
  const [month, setMonth] = useState(initialMonth);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [expenseResult, incomeResult] = await Promise.all([
        api.getExpenses(),
        api.getIncomes(),
      ]);

      if (!expenseResult.success || !incomeResult.success) {
        throw new Error('Could not load financial transactions.');
      }

      setExpenses(expenseResult.expenses || []);
      setIncomes(incomeResult.incomes || []);
    } catch (err) {
      setError(err.message || 'Failed to load financial analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const analytics = useMemo(() => {
    const previousMonth = getPreviousMonth(month);
    const sixMonths = getLastSixMonths(month);

    const expensesForMonth = expenses.filter(
      (item) => transactionMonth(item) === month
    );

    const incomesForMonth = incomes.filter(
      (item) => transactionMonth(item) === month
    );

    const previousExpenses = expenses
      .filter((item) => transactionMonth(item) === previousMonth)
      .reduce((total, item) => total + transactionAmount(item), 0);

    const previousIncome = incomes
      .filter((item) => transactionMonth(item) === previousMonth)
      .reduce((total, item) => total + transactionAmount(item), 0);

    const totalExpenses = expensesForMonth.reduce(
      (total, item) => total + transactionAmount(item),
      0
    );

    const totalIncome = incomesForMonth.reduce(
      (total, item) => total + transactionAmount(item),
      0
    );

    const balance = totalIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0 ? (balance / totalIncome) * 100 : null;

    const categoryMap = {};

    expensesForMonth.forEach((item) => {
      const name = categoryName(item);
      categoryMap[name] =
        (categoryMap[name] || 0) + transactionAmount(item);
    });

    const categories = Object.entries(categoryMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage:
          totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthlyTrend = sixMonths.map((value) => {
      const income = incomes
        .filter((item) => transactionMonth(item) === value)
        .reduce((total, item) => total + transactionAmount(item), 0);

      const expense = expenses
        .filter((item) => transactionMonth(item) === value)
        .reduce((total, item) => total + transactionAmount(item), 0);

      return {
        month: value,
        label: getMonthName(value),
        income,
        expense,
        savings: income - expense,
      };
    });

    const expenseChange =
      previousExpenses > 0
        ? ((totalExpenses - previousExpenses) / previousExpenses) * 100
        : totalExpenses > 0
          ? null
          : 0;

    const incomeChange =
      previousIncome > 0
        ? ((totalIncome - previousIncome) / previousIncome) * 100
        : totalIncome > 0
          ? null
          : 0;

    const previousCategoryMap = {};

    expenses
      .filter((item) => transactionMonth(item) === previousMonth)
      .forEach((item) => {
        const name = categoryName(item);
        previousCategoryMap[name] =
          (previousCategoryMap[name] || 0) + transactionAmount(item);
      });

    const categoryChanges = categories
      .map((category) => {
        const previous = previousCategoryMap[category.name] || 0;

        return {
          ...category,
          previous,
          change: category.amount - previous,
          changePercent:
            previous > 0
              ? ((category.amount - previous) / previous) * 100
              : category.amount > 0
                ? null
                : 0,
        };
      })
      .filter((category) => category.change > 0)
      .sort((a, b) => b.change - a.change);

    return {
      previousMonth,
      totalExpenses,
      totalIncome,
      balance,
      savingsRate,
      previousExpenses,
      previousIncome,
      expenseChange,
      incomeChange,
      categories,
      monthlyTrend,
      categoryChanges,
      expenseCount: expensesForMonth.length,
      incomeCount: incomesForMonth.length,
    };
  }, [expenses, incomes, month]);

  const maxTrendValue = Math.max(
    1,
    ...analytics.monthlyTrend.flatMap((item) => [
      item.income,
      item.expense,
    ])
  );

  const percentText = (value) => {
    if (value === null) return 'No previous-month baseline';
    if (value === 0) return 'No change from last month';

    return `${Math.abs(value).toFixed(1)}% ${
      value > 0 ? 'higher' : 'lower'
    } than last month`;
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sky-500">
            <ChartNoAxesCombined className="h-7 w-7" />
            <span className="text-xs font-black uppercase tracking-widest">
              Financial intelligence
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Financial Analytics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Understand your spending, income, and savings trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <CalendarDays className="h-4 w-4 text-sky-500" />
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="min-w-0 bg-transparent text-sm font-bold outline-none"
            />
          </label>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-3 py-2 text-sm font-bold text-sky-700 hover:bg-sky-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-sm font-semibold text-slate-500">
          Loading your financial analytics…
        </div>
      ) : (
        <>
          <p className="text-sm font-bold text-slate-500">
            Report for {getMonthName(month)}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total income"
              value={money(analytics.totalIncome)}
              detail={`${analytics.incomeCount} income transaction(s)`}
              icon={Wallet}
              tone="green"
            />

            <StatCard
              title="Total expenses"
              value={money(analytics.totalExpenses)}
              detail={`${analytics.expenseCount} expense transaction(s)`}
              icon={Receipt}
              tone="rose"
            />

            <StatCard
              title="Net savings"
              value={money(analytics.balance)}
              detail={
                analytics.balance < 0
                  ? 'Expenses exceed income this month'
                  : 'Income minus recorded expenses'
              }
              icon={PiggyBank}
              tone={analytics.balance < 0 ? 'rose' : 'sky'}
            />

            <StatCard
              title="Savings rate"
              value={
                analytics.savingsRate === null
                  ? '—'
                  : `${analytics.savingsRate.toFixed(1)}%`
              }
              detail="Net savings divided by income"
              icon={ChartNoAxesCombined}
              tone="amber"
            />
          </div>

          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-900">
                Month-over-month comparison
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {getMonthName(month)} compared with{' '}
                {getMonthName(analytics.previousMonth)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  {analytics.expenseChange !== null &&
                  analytics.expenseChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-rose-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-emerald-600" />
                  )}
                  Expense change
                </div>

                <p className="mt-3 text-2xl font-black text-slate-900">
                  {money(analytics.totalExpenses - analytics.previousExpenses)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Previous month: {money(analytics.previousExpenses)}
                </p>

                <p className="mt-2 text-xs font-bold text-slate-600">
                  {percentText(analytics.expenseChange)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  {analytics.incomeChange !== null &&
                  analytics.incomeChange < 0 ? (
                    <ArrowDownRight className="h-4 w-4 text-rose-500" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  )}
                  Income change
                </div>

                <p className="mt-3 text-2xl font-black text-slate-900">
                  {money(analytics.totalIncome - analytics.previousIncome)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Previous month: {money(analytics.previousIncome)}
                </p>

                <p className="mt-2 text-xs font-bold text-slate-600">
                  {percentText(analytics.incomeChange)}
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-black text-slate-900">
                Income vs expenses
              </h2>
              <p className="mb-6 mt-1 text-sm text-slate-500">
                Six-month comparison
              </p>

              <div className="space-y-5">
                {analytics.monthlyTrend.map((item) => (
                  <div key={item.month}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-600">
                        {item.label}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Net: {money(item.savings)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-[10px] font-bold text-emerald-700">
                          Income
                        </span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${(item.income / maxTrendValue) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-20 text-right text-[10px] font-bold text-slate-600">
                          {money(item.income)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-14 text-[10px] font-bold text-rose-700">
                          Expense
                        </span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-rose-400"
                            style={{
                              width: `${(item.expense / maxTrendValue) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-20 text-right text-[10px] font-bold text-slate-600">
                          {money(item.expense)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Income
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  Expenses
                </span>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-black text-slate-900">
                Category-wise spending
              </h2>
              <p className="mb-6 mt-1 text-sm text-slate-500">
                Where your money went this month
              </p>

              {analytics.categories.length === 0 ? (
                <EmptyState>
                  No expenses recorded for this month.
                </EmptyState>
              ) : (
                <div className="space-y-5">
                  {analytics.categories.map((category) => (
                    <div key={category.name}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-bold text-slate-700">
                          {category.name}
                        </span>
                        <span className="shrink-0 text-sm font-black text-slate-900">
                          {money(category.amount)}
                        </span>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>

                      <p className="mt-1 text-right text-[10px] font-bold text-slate-400">
                        {category.percentage.toFixed(1)}% of expenses
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black text-slate-900">
              Spending insights
            </h2>
            <p className="mb-5 mt-1 text-sm text-slate-500">
              Observations based on your recorded transactions
            </p>

            <div className="space-y-3">
              {analytics.totalIncome === 0 &&
                analytics.totalExpenses === 0 && (
                  <EmptyState>
                    Add income and expense transactions to unlock insights.
                  </EmptyState>
                )}

              {analytics.totalIncome > 0 && (
                <div className="flex items-start gap-3 rounded-2xl bg-sky-50 p-4">
                  <PiggyBank className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      Savings position
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {analytics.balance >= 0
                        ? `You retained ${money(analytics.balance)} after recorded expenses this month.`
                        : `You spent ${money(Math.abs(analytics.balance))} more than your recorded income this month.`}
                    </p>
                  </div>
                </div>
              )}

              {analytics.categories[0] && (
                <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
                  <Receipt className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      Largest expense category
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {analytics.categories[0].name} accounts for{' '}
                      {analytics.categories[0].percentage.toFixed(1)}% of
                      your recorded expenses this month.
                    </p>
                  </div>
                </div>
              )}

              {analytics.categoryChanges[0] && (
                <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4">
                  <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      Category spending increased
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {analytics.categoryChanges[0].name} increased by{' '}
                      {money(analytics.categoryChanges[0].change)} compared
                      with last month.
                    </p>
                  </div>
                </div>
              )}

              {analytics.expenseChange !== null &&
                analytics.expenseChange > 0 && (
                  <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4">
                    <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                    <div>
                      <p className="text-sm font-black text-slate-800">
                        Expenses are higher
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Total recorded expenses increased by{' '}
                        {analytics.expenseChange.toFixed(1)}% compared with
                        the previous month.
                      </p>
                    </div>
                  </div>
                )}

              {analytics.expenseChange !== null &&
                analytics.expenseChange < 0 && (
                  <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4">
                    <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-black text-slate-800">
                        Expenses are lower
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Your recorded expenses decreased by{' '}
                        {Math.abs(analytics.expenseChange).toFixed(1)}%
                        compared with the previous month.
                      </p>
                    </div>
                  </div>
                )}
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-400">
              Insights use transactions currently recorded in SpendWise.
              They are descriptive comparisons, not predictions of future
              spending.
            </p>
          </section>
        </>
      )}
    </div>
  );
};

export default FinancialAnalyticsPage;
