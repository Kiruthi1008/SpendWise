
import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Plus,
  Repeat2,
  Pause,
  Play,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Receipt,
  Clock3,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.js';

const today = () => new Date().toISOString().slice(0, 10);

const currentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
};

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const prettyDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No end date';

export const RecurringTransactionsPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');

  const [form, setForm] = useState({
    type: 'expense',
    frequency: 'monthly',
    start_date: today(),
    end_date: '',
    time: currentTime(),
    amount: '',
    category_id: '',
    source_id: '',
    note: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [scheduleResult, categoryResult, sourceResult] =
        await Promise.all([
          api.getRecurringTransactions(),
          api.getExpenseCategories(),
          api.getIncomeSources(),
        ]);

      setSchedules(scheduleResult.schedules || []);
      setCategories(categoryResult.categories || []);
      setSources(sourceResult.sources || []);

      if (scheduleResult.createdCount > 0) {
        setNotice(
          `${scheduleResult.createdCount} due recurring transaction(s) added to your records.`
        );
      }
    } catch (err) {
      setError(err.message || 'Could not load recurring transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (form.type === 'expense' && !form.category_id && categories.length) {
      setForm((old) => ({ ...old, category_id: categories[0].id }));
    }

    if (form.type === 'income' && !form.source_id && sources.length) {
      setForm((old) => ({ ...old, source_id: sources[0].id }));
    }
  }, [form.type, form.category_id, form.source_id, categories, sources]);

  const visibleSchedules = useMemo(
    () =>
      schedules.filter(
        (item) => typeFilter === 'all' || item.type === typeFilter
      ),
    [schedules, typeFilter]
  );

  const activeCount = schedules.filter(
    (item) => item.status === 'active'
  ).length;

  const filteredAmount = visibleSchedules.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const updateForm = (key, value) => {
    setForm((old) => ({ ...old, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }

    if (form.end_date && form.end_date < form.start_date) {
      setError('The end date cannot be before the start date.');
      return;
    }

    if (form.type === 'expense' && !form.category_id) {
      setError('Please choose an expense category.');
      return;
    }

    if (form.type === 'income' && !form.source_id) {
      setError('Please choose an income source.');
      return;
    }

    const payload = {
      type: form.type,
      frequency: form.frequency,
      start_date: form.start_date,
      end_date: form.end_date || null,
      time: form.time,
      amount: Number(form.amount),
      note: form.note.trim(),
      ...(form.type === 'expense'
        ? { category_id: form.category_id }
        : { source_id: form.source_id }),
    };

    setSaving(true);

    try {
      const result = await api.createRecurringTransaction(payload);

      setNotice(result.message || 'Recurring transaction created.');
      setForm((old) => ({
        ...old,
        amount: '',
        note: '',
        start_date: today(),
        end_date: '',
      }));

      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message || 'Could not create recurring transaction.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (schedule) => {
    setError('');
    setNotice('');

    try {
      const nextStatus =
        schedule.status === 'active' ? 'paused' : 'active';

      const result = await api.setRecurringTransactionStatus(
        schedule.id,
        nextStatus
      );

      setNotice(result.message || `Schedule ${nextStatus}.`);
      await load();
    } catch (err) {
      setError(err.message || 'Could not update this schedule.');
    }
  };

  const removeSchedule = async (schedule) => {
    if (
      !window.confirm(
        'Delete this recurring schedule? Transactions already created will remain in your records.'
      )
    ) {
      return;
    }

    setError('');
    setNotice('');

    try {
      const result = await api.deleteRecurringTransaction(schedule.id);

      setSchedules((old) =>
        old.filter((item) => item.id !== schedule.id)
      );

      setNotice(result.message || 'Recurring schedule deleted.');
    } catch (err) {
      setError(err.message || 'Could not delete this schedule.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sky-500">
            <CalendarClock className="h-7 w-7" />
            <span className="text-xs font-black uppercase tracking-widest">
              Automation
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Recurring Transactions
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Schedule regular expenses and income without entering the
            same transaction repeatedly.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm((value) => !value);
            setError('');
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-md transition hover:bg-sky-600"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Close form' : 'New schedule'}
        </button>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-sky-100 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Total schedules
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {schedules.length}
          </p>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Active schedules
          </p>
          <p className="mt-2 text-3xl font-black text-emerald-600">
            {activeCount}
          </p>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Visible scheduled amounts
          </p>
          <p className="mt-2 text-3xl font-black text-sky-600">
            {money(filteredAmount)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Sum of schedule amounts, not a monthly forecast
          </p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="space-y-5 rounded-3xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Create recurring schedule
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The transaction is created when its start date becomes due
              and the API processes the schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-bold text-slate-600">
              Transaction type
              <select
                value={form.type}
                onChange={(e) => updateForm('type', e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>

            <label className="text-xs font-bold text-slate-600">
              Repeat
              <select
                value={form.frequency}
                onChange={(e) => updateForm('frequency', e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
              >
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
                <option value="yearly">Every year</option>
              </select>
            </label>

            <label className="text-xs font-bold text-slate-600">
              Amount (₹)
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => updateForm('amount', e.target.value)}
                placeholder="0.00"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
              />
            </label>

            {form.type === 'expense' ? (
              <label className="text-xs font-bold text-slate-600">
                Expense category
                <select
                  required
                  value={form.category_id}
                  onChange={(e) =>
                    updateForm('category_id', e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="">Choose category</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="text-xs font-bold text-slate-600">
                Income source
                <select
                  required
                  value={form.source_id}
                  onChange={(e) => updateForm('source_id', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="">Choose source</option>
                  {sources.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="text-xs font-bold text-slate-600">
              Start date
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => updateForm('start_date', e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
              />
            </label>

            <label className="text-xs font-bold text-slate-600">
              End date (optional)
              <input
                type="date"
                min={form.start_date}
                value={form.end_date}
                onChange={(e) => updateForm('end_date', e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
              />
            </label>

            <label className="text-xs font-bold text-slate-600">
              Transaction time
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => updateForm('time', e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
              />
            </label>

            <label className="text-xs font-bold text-slate-600 sm:col-span-2">
              Note (optional)
              <input
                maxLength={300}
                value={form.note}
                onChange={(e) => updateForm('note', e.target.value)}
                placeholder="e.g. Monthly rent"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-600 disabled:opacity-60"
            >
              {saving ? 'Saving schedule…' : 'Save schedule'}
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-sky-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Your schedules
            </h2>
            <p className="text-xs text-slate-500">
              Existing transactions remain in their regular lists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold"
            >
              <option value="all">All types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>

            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm font-semibold text-slate-500">
            Loading schedules…
          </div>
        ) : visibleSchedules.length === 0 ? (
          <div className="flex flex-col items-center p-10 text-center">
            <Repeat2 className="h-10 w-10 text-sky-300" />
            <p className="mt-3 font-black text-slate-800">
              No recurring schedules yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Schedule rent, salary, bills, or other regular transactions.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleSchedules.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={`rounded-2xl p-3 ${
                      item.type === 'expense'
                        ? 'bg-rose-50 text-rose-500'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {item.type === 'expense' ? (
                      <Receipt className="h-5 w-5" />
                    ) : (
                      <Wallet className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900">
                        {item.type === 'expense'
                          ? item.category_name
                          : item.source_name}
                      </h3>

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === 'completed'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-bold text-slate-600">
                      {money(item.amount)} · {item.frequency}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Next:{' '}
                        {item.status === 'completed'
                          ? 'Completed'
                          : prettyDate(item.next_run_date)}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {item.time}
                      </span>

                      {item.end_date && (
                        <span>Ends {prettyDate(item.end_date)}</span>
                      )}
                    </div>

                    {item.note && (
                      <p className="mt-2 break-words text-xs text-slate-500">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {item.status !== 'completed' && (
                    <button
                      onClick={() => toggleStatus(item)}
                      title={
                        item.status === 'active'
                          ? 'Pause schedule'
                          : 'Resume schedule'
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 px-3 py-2 text-xs font-black text-sky-700 hover:bg-sky-50"
                    >
                      {item.status === 'active' ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      {item.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                  )}

                  <button
                    onClick={() => removeSchedule(item)}
                    title="Delete schedule"
                    className="rounded-xl border border-rose-100 p-2.5 text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="flex items-start gap-2 px-1 text-xs leading-5 text-slate-500">
        <Repeat2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
        Schedules are processed when the recurring-transactions API is
        accessed. This page does not yet run an independent background
        scheduler.
      </p>
    </div>
  );
};

export default RecurringTransactionsPage;
