
import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Plus,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Trash2,
  Pencil,
  X,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { api } from '../services/api.js';

const today = () => new Date().toISOString().slice(0, 10);

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const dateLabel = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const initialForm = () => ({
  name: '',
  amount: '',
  category: 'Utilities',
  due_date: today(),
  frequency: 'monthly',
  notes: '',
});

export const BillsPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(initialForm());

  const loadBills = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api.getBills();
      setBills(result.bills || []);
    } catch (err) {
      setError(err.message || 'Could not load bills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const summary = useMemo(() => ({
    total: bills.length,
    upcoming: bills.filter((bill) => bill.status === 'upcoming').length,
    overdue: bills.filter((bill) => bill.status === 'overdue').length,
    paid: bills.filter((bill) => bill.status === 'paid').length,
    unpaid: bills
      .filter((bill) => ['upcoming', 'overdue'].includes(bill.status))
      .reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
  }), [bills]);

  const visibleBills = useMemo(() => {
    const filtered = filter === 'all'
      ? bills
      : bills.filter((bill) => bill.status === filter);

    return [...filtered].sort((a, b) =>
      a.due_date.localeCompare(b.due_date)
    );
  }, [bills, filter]);

  const updateField = (key, value) => {
    setForm((old) => ({ ...old, [key]: value }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(initialForm());
    setError('');
    setNotice('');
    setShowForm(true);
  };

  const openEditForm = (bill) => {
    setEditingId(bill.id);
    setForm({
      name: bill.name,
      amount: String(bill.amount),
      category: bill.category || 'Other',
      due_date: bill.due_date,
      frequency: bill.frequency,
      notes: bill.notes || '',
    });
    setError('');
    setNotice('');
    setShowForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      const result = editingId
        ? await api.updateBill(editingId, payload)
        : await api.createBill(payload);

      setNotice(
        result.message ||
        (editingId ? 'Bill updated.' : 'Bill created.')
      );

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm());
      await loadBills();
    } catch (err) {
      setError(err.message || 'Could not save bill.');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (bill) => {
    if (
      !window.confirm(
        `Mark "${bill.name}" as paid? This records a payment in SpendWise.`
      )
    ) {
      return;
    }

    setError('');
    setNotice('');

    try {
      const result = await api.payBill(bill.id, today());
      setNotice(result.message || 'Payment recorded.');
      await loadBills();
    } catch (err) {
      setError(err.message || 'Could not record payment.');
    }
  };

  const deleteBill = async (bill) => {
    if (!window.confirm(`Delete "${bill.name}" and its bill history?`)) {
      return;
    }

    setError('');
    setNotice('');

    try {
      const result = await api.deleteBill(bill.id);
      setNotice(result.message || 'Bill deleted.');
      await loadBills();
    } catch (err) {
      setError(err.message || 'Could not delete bill.');
    }
  };

  const cancelBill = async (bill) => {
    if (!window.confirm(`Cancel "${bill.name}"?`)) return;

    try {
      const result = await api.cancelBill(bill.id);
      setNotice(result.message || 'Bill cancelled.');
      await loadBills();
    } catch (err) {
      setError(err.message || 'Could not cancel bill.');
    }
  };

  const statusStyle = {
    upcoming: 'bg-sky-50 text-sky-700',
    overdue: 'bg-rose-50 text-rose-700',
    paid: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sky-500">
            <CalendarClock className="h-7 w-7" />
            <span className="text-xs font-black uppercase tracking-widest">
              Payments
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900">
            Bills & Subscriptions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track bills, due dates, subscriptions, and payment history.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-black text-white hover:bg-sky-600"
        >
          <Plus className="h-4 w-4" />
          Add bill
        </button>
      </section>

      {error && (
        <div role="alert" className="flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {notice && (
        <div role="status" className="flex gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Upcoming', summary.upcoming, 'text-sky-600'],
          ['Overdue', summary.overdue, 'text-rose-600'],
          ['Paid bills', summary.paid, 'text-emerald-600'],
          ['Unpaid amount', money(summary.unpaid), 'text-amber-600'],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className={`mt-2 text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-900">
              {editingId ? 'Edit bill' : 'Create bill'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-bold text-slate-600">
              Bill name
              <input
                required
                maxLength={120}
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Home Wi-Fi"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
              />
            </label>

            <label className="text-xs font-bold text-slate-600">
              Amount (₹)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                placeholder="0.00"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
              />
            </label>

            <label className="text-xs font-bold text-slate-600">
              Category
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
              >
                <option>Utilities</option>
                <option>Rent</option>
                <option>Internet</option>
                <option>Mobile</option>
                <option>Subscription</option>
                <option>Loan / EMI</option>
                <option>Insurance</option>
                <option>Education</option>
                <option>Other</option>
              </select>
            </label>

            <label className="text-xs font-bold text-slate-600">
              Due date
              <input
                required
                type="date"
                value={form.due_date}
                onChange={(e) => updateField('due_date', e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
              />
            </label>

            <label className="text-xs font-bold text-slate-600">
              Frequency
              <select
                required
                value={form.frequency}
                onChange={(e) => updateField('frequency', e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
              >
                <option value="one-time">One time</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>

            <label className="text-xs font-bold text-slate-600 sm:col-span-2 lg:col-span-1">
              Notes
              <input
                maxLength={300}
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Optional notes"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white hover:bg-sky-600 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create bill'}
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Your bills
            </h2>
            <p className="text-xs text-slate-500">
              {summary.total} bill record(s)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold"
            >
              <option value="all">All bills</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={loadBills}
              disabled={loading}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              aria-label="Refresh bills"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading bills…
          </div>
        ) : visibleBills.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt className="mx-auto h-10 w-10 text-sky-300" />
            <p className="mt-3 font-black text-slate-800">No bills found</p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first bill or change the filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleBills.map((bill) => (
              <article key={bill.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
                    <CreditCard className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900">{bill.name}</h3>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${statusStyle[bill.status] || statusStyle.upcoming}`}>
                        {bill.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-black text-slate-700">
                      {money(bill.amount)} · {bill.category}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Due {dateLabel(bill.due_date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {bill.frequency}
                      </span>
                    </div>

                    {bill.last_paid_date && (
                      <p className="mt-2 text-xs text-emerald-600">
                        Last paid: {dateLabel(bill.last_paid_date)}
                      </p>
                    )}

                    {bill.notes && (
                      <p className="mt-1 break-words text-xs text-slate-500">
                        {bill.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {['upcoming', 'overdue'].includes(bill.status) && (
                    <>
                      <button
                        onClick={() => markPaid(bill)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark paid
                      </button>

                      <button
                        onClick={() => openEditForm(bill)}
                        className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                        title="Edit bill"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => cancelBill(bill)}
                        className="rounded-xl border border-amber-200 p-2 text-amber-600 hover:bg-amber-50"
                        title="Cancel bill"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => deleteBill(bill)}
                    className="rounded-xl border border-rose-100 p-2 text-rose-500 hover:bg-rose-50"
                    title="Delete bill"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-400">
        This tracker records payment status in SpendWise; it does not
        initiate payments with banks or subscription providers. Reminders
        are displayed when the app is accessed, not delivered as background
        push notifications.
      </p>
    </div>
  );
};

export default BillsPage;
