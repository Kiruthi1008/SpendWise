
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api.js';

const localDateString = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const today = localDateString();
const initialMonthStart = `${today.slice(0, 7)}-01`;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const csvCell = (value) =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

function downloadCSV(filename, headers, rows) {
  const content = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF', content], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const getDate = (item) => String(item.date || '').slice(0, 10);

export const FinancialReportsPage = () => {
  // Selected dates in the controls.
  const [startDate, setStartDate] = useState(initialMonthStart);
  const [endDate, setEndDate] = useState(today);

  // Dates currently applied to the report.
  const [appliedStartDate, setAppliedStartDate] = useState(initialMonthStart);
  const [appliedEndDate, setAppliedEndDate] = useState(today);

  const [allExpenses, setAllExpenses] = useState([]);
  const [allIncomes, setAllIncomes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Fetch all transactions; apply the selected period locally.
  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [expenseResponse, incomeResponse] = await Promise.all([
        api.getExpenses(),
        api.getIncomes(),
      ]);

      if (
        expenseResponse.success === false ||
        incomeResponse.success === false
      ) {
        throw new Error('The API could not load all financial records.');
      }

      if (
        !Array.isArray(expenseResponse.expenses) ||
        !Array.isArray(incomeResponse.incomes)
      ) {
        throw new Error(
          'The API response is missing expenses or incomes. Check the backend response.'
        );
      }

      setAllExpenses(expenseResponse.expenses);
      setAllIncomes(incomeResponse.incomes);
      setLoaded(true);
    } catch (err) {
      setError(
        err.message || 'Could not load financial data. Please try again.'
      );
      setLoaded(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once on page entry. Refresh button can trigger another fetch.
  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const applyDateRange = () => {
    if (!startDate || !endDate) {
      setError('Please select both dates.');
      return;
    }

    if (startDate > endDate) {
      setError('Start date cannot be later than end date.');
      return;
    }

    setError('');
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  const expenses = useMemo(
    () =>
      allExpenses.filter((item) => {
        const date = getDate(item);
        return (
          date &&
          date >= appliedStartDate &&
          date <= appliedEndDate
        );
      }),
    [allExpenses, appliedStartDate, appliedEndDate]
  );

  const incomes = useMemo(
    () =>
      allIncomes.filter((item) => {
        const date = getDate(item);
        return (
          date &&
          date >= appliedStartDate &&
          date <= appliedEndDate
        );
      }),
    [allIncomes, appliedStartDate, appliedEndDate]
  );

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  const totalIncome = incomes.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  const netBalance = totalIncome - totalExpenses;

  const transactions = useMemo(
    () =>
      [
        ...expenses.map((item) => ({
          id: `expense-${item.id}`,
          date: getDate(item),
          time: item.time || '',
          type: 'Expense',
          category: item.category_name || 'Uncategorized',
          amount: Number(item.amount) || 0,
          note: item.note || '',
        })),
        ...incomes.map((item) => ({
          id: `income-${item.id}`,
          date: getDate(item),
          time: item.time || '',
          type: 'Income',
          category: item.source_name || 'Other Income',
          amount: Number(item.amount) || 0,
          note: item.note || '',
        })),
      ].sort((a, b) =>
        `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
      ),
    [expenses, incomes]
  );

  const filenamePeriod = `${appliedStartDate}_to_${appliedEndDate}`;

  const exportExpenses = () => {
    downloadCSV(
      `SpendWise_Expenses_${filenamePeriod}.csv`,
      ['Date', 'Time', 'Category', 'Amount (INR)', 'Note'],
      expenses.map((item) => [
        item.date,
        item.time,
        item.category_name || 'Uncategorized',
        item.amount,
        item.note || '',
      ])
    );
  };

  const exportIncomes = () => {
    downloadCSV(
      `SpendWise_Incomes_${filenamePeriod}.csv`,
      ['Date', 'Time', 'Source', 'Amount (INR)', 'Note'],
      incomes.map((item) => [
        item.date,
        item.time,
        item.source_name || 'Other Income',
        item.amount,
        item.note || '',
      ])
    );
  };

  const exportCombined = () => {
    downloadCSV(
      `SpendWise_Report_${filenamePeriod}.csv`,
      [
        'Date',
        'Time',
        'Type',
        'Category / Source',
        'Amount (INR)',
        'Note',
      ],
      transactions.map((item) => [
        item.date,
        item.time,
        item.type,
        item.category,
        item.amount,
        item.note,
      ])
    );
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <div className={`rounded-xl p-2 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 break-words text-xl font-black text-slate-900 sm:text-2xl">
        {formatCurrency(value)}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-sky-600">
            SpendWise / Reports
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            Financial Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review, filter, and export your saved income and expenses.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReport}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          {loading ? 'Refreshing...' : 'Refresh report'}
        </button>
      </header>

      <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-sky-600" />
          <h2 className="font-extrabold text-slate-900">Report period</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="text-sm font-bold text-slate-600">
            Start date
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-medium text-slate-800"
            />
          </label>

          <label className="text-sm font-bold text-slate-600">
            End date
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              max={today}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-medium text-slate-800"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={applyDateRange}
              disabled={loading}
              className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply date range
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loaded && !loading && !error && transactions.length === 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            No transactions were found for {appliedStartDate} to {appliedEndDate}.
            Check the selected dates or add transactions in Manage Expenses and Manage Incomes.
            <p className="mt-1">
              Records returned by the API: {allExpenses.length} expenses and {allIncomes.length} income records.
            </p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total income"
          value={totalIncome}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total expenses"
          value={totalExpenses}
          icon={TrendingDown}
          color="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Net balance"
          value={netBalance}
          icon={Wallet}
          color={
            netBalance >= 0
              ? 'bg-sky-50 text-sky-600'
              : 'bg-amber-50 text-amber-600'
          }
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">Export your data</h2>
        <p className="mt-1 text-sm text-slate-500">
          Exports include only records in the applied date range.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={exportExpenses}
            disabled={!loaded || loading}
            className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-left hover:bg-rose-50 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-6 w-6 shrink-0 text-rose-600" />
            <span>
              <span className="block font-extrabold text-slate-800">Expenses CSV</span>
              <span className="text-xs text-slate-500">Expense records only</span>
            </span>
            <Download className="ml-auto h-4 w-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={exportIncomes}
            disabled={!loaded || loading}
            className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-left hover:bg-emerald-50 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-6 w-6 shrink-0 text-emerald-600" />
            <span>
              <span className="block font-extrabold text-slate-800">Income CSV</span>
              <span className="text-xs text-slate-500">Income records only</span>
            </span>
            <Download className="ml-auto h-4 w-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={exportCombined}
            disabled={!loaded || loading}
            className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/50 p-4 text-left hover:bg-sky-50 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-6 w-6 shrink-0 text-sky-600" />
            <span>
              <span className="block font-extrabold text-slate-800">Combined CSV</span>
              <span className="text-xs text-slate-500">Income and expenses</span>
            </span>
            <Download className="ml-auto h-4 w-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            disabled={!loaded || loading}
            className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4 text-left hover:bg-violet-50 disabled:opacity-50"
          >
            <FileText className="h-6 w-6 shrink-0 text-violet-600" />
            <span>
              <span className="block font-extrabold text-slate-800">Save as PDF</span>
              <span className="text-xs text-slate-500">Print-friendly summary</span>
            </span>
            <Printer className="ml-auto h-4 w-4 text-slate-400" />
          </button>
        </div>
      </section>

      <section className="report-print-area rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-sky-600">
              SpendWise
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              Financial Summary
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {appliedStartDate} to {appliedEndDate}
            </p>
          </div>
          <div className="text-sm text-slate-500">
            {transactions.length} transactions
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700">Income</p>
            <p className="mt-1 font-black text-emerald-800">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="rounded-xl bg-rose-50 p-4">
            <p className="text-xs font-bold text-rose-700">Expenses</p>
            <p className="mt-1 font-black text-rose-800">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="rounded-xl bg-sky-50 p-4">
            <p className="text-xs font-bold text-sky-700">Net balance</p>
            <p className="mt-1 font-black text-sky-800">
              {formatCurrency(netBalance)}
            </p>
          </div>
        </div>

        <h3 className="mb-3 font-extrabold text-slate-900">Transactions</h3>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Category / Source</th>
                <th className="px-3 py-3">Note</th>
                <th className="px-3 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="whitespace-nowrap px-3 py-3">{item.date}</td>
                  <td
                    className={`px-3 py-3 font-bold ${
                      item.type === 'Income'
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {item.type}
                  </td>
                  <td className="px-3 py-3">{item.category}</td>
                  <td className="px-3 py-3">{item.note || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-bold">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}

              {loaded && transactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-slate-500">
                    No transactions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Generated by SpendWise for the applied date range.
        </p>
      </section>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .report-print-area,
          .report-print-area * {
            visibility: visible !important;
          }
          .report-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .report-print-area table {
            width: 100% !important;
            min-width: 0 !important;
            font-size: 10px !important;
          }
          .report-print-area th,
          .report-print-area td {
            padding: 6px !important;
          }
          @page {
            size: auto;
            margin: 12mm;
          }
        }
      `}</style>
    </div>
  );
};
