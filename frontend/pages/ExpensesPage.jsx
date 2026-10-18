
import React, { useCallback, useEffect, useState } from 'react';
import {
  Receipt, Plus, Search, Trash2, Edit2, Download, X,
  AlertCircle, Calendar, Clock, Filter,
} from 'lucide-react';
import { api } from '../services/api.js';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const today = () => {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export const ExpensesPage = ({ initialOpenAdd = false }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [modalOpen, setModalOpen] = useState(initialOpenAdd);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [customName, setCustomName] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [expenseResult, categoryResult] = await Promise.all([
        api.getExpenses(),
        api.getExpenseCategories(),
      ]);

      setExpenses(expenseResult.expenses || []);
      setCategories(categoryResult.categories || []);
      setCategoryId((current) =>
        current || categoryResult.categories?.[0]?.id || ''
      );
    } catch (err) {
      setError(err.message || 'Unable to load expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (initialOpenAdd) openAdd();
    // Only respond when the parent requests the modal to open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpenAdd]);

  const openAdd = () => {
    setEditing(null);
    setDate(today());
    setTime(new Date().toTimeString().slice(0, 5));
    setCategoryId(categories[0]?.id || '');
    setAmount('');
    setNote('');
    setCustomName('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditing(expense);
    setDate(String(expense.date || today()).slice(0, 10));
    setTime(String(expense.time || '12:00').slice(0, 5));
    setCategoryId(expense.category_id || '');
    setAmount(String(expense.amount ?? ''));
    setNote(expense.note || '');
    setCustomName('');
    setError('');
    setModalOpen(true);
  };

  const addCustomCategory = async () => {
    if (!customName.trim()) {
      setError('Enter a category name.');
      return;
    }

    try {
      const result = await api.addExpenseCategory(customName.trim());
      if (result.category) {
        setCategories((current) => [...current, result.category]);
        setCategoryId(result.category.id);
        setCustomName('');
      }
    } catch (err) {
      setError(err.message || 'Could not add category.');
    }
  };

  const submitExpense = async (event) => {
    event.preventDefault();
    setError('');

    if (!date || !time || !categoryId) {
      setError('Date, time, and category are required.');
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }

    const selected = categories.find(
      (item) => String(item.id) === String(categoryId)
    );

    setSaving(true);
    try {
      const payload = {
        date,
        time,
        category_id: categoryId,
        category_name: selected?.name || 'Uncategorized',
        amount: numericAmount,
        note: note.trim(),
      };

      const result = editing
        ? await api.updateExpense(editing.id, payload)
        : await api.createExpense(payload);

      if (result.success) {
        await loadData();
        setModalOpen(false);
      } else {
        setError(result.message || 'Unable to save expense.');
      }
    } catch (err) {
      setError(err.message || 'Unable to save expense.');
    } finally {
      setSaving(false);
    }
  };

  const removeExpense = async () => {
    try {
      const result = await api.deleteExpense(deleteId);
      if (result.success) {
        setExpenses((current) =>
          current.filter((item) => item.id !== deleteId)
        );
        setDeleteId(null);
      }
    } catch (err) {
      setError(err.message || 'Unable to delete expense.');
    }
  };

  const filtered = expenses
    .filter((item) => {
      const query = search.trim().toLowerCase();
      const itemDate = String(item.date || '').slice(0, 10);

      const matchesSearch =
        !query ||
        String(item.category_name || '').toLowerCase().includes(query) ||
        String(item.note || '').toLowerCase().includes(query) ||
        String(item.amount ?? '').includes(query);

      const matchesCategory =
        category === 'all' ||
        String(item.category_id) === String(category);

      return (
        matchesSearch &&
        matchesCategory &&
        (!startDate || itemDate >= startDate) &&
        (!endDate || itemDate <= endDate)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'highest') return Number(b.amount) - Number(a.amount);
      if (sortBy === 'lowest') return Number(a.amount) - Number(b.amount);

      const aDate = `${a.date || ''} ${a.time || ''}`;
      const bDate = `${b.date || ''} ${b.time || ''}`;

      return sortBy === 'oldest'
        ? aDate.localeCompare(bDate)
        : bDate.localeCompare(aDate);
    });

  const total = filtered.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
  };

  const exportCSV = () => {
    const quote = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const rows = [
      ['Date', 'Time', 'Category', 'Amount INR', 'Note'],
      ...filtered.map((item) => [
        item.date,
        item.time,
        item.category_name,
        item.amount,
        item.note,
      ]),
    ];

    const blob = new Blob(
      ['\uFEFF', rows.map((row) => row.map(quote).join(',')).join('\r\n')],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SpendWise_Expenses_${today()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
            <Receipt className="h-7 w-7 text-sky-500" />
            Manage Expenses
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Add, search, edit, and organize your expenses.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-3 text-xs font-bold text-sky-700">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-xs font-bold text-white">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </header>

      {error && !modalOpen && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sky-100 bg-white p-5">
          <p className="text-xs font-bold text-slate-500">Filtered total</p>
          <p className="mt-2 text-2xl font-black text-rose-600">{formatCurrency(total)}</p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-white p-5">
          <p className="text-xs font-bold text-slate-500">Records</p>
          <p className="mt-2 text-2xl font-black">{filtered.length}</p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-white p-5">
          <p className="text-xs font-bold text-slate-500">Average expense</p>
          <p className="mt-2 text-2xl font-black text-sky-600">
            {formatCurrency(filtered.length ? total / filtered.length : 0)}
          </p>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-sky-100 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-bold text-slate-600">
          Search
          <span className="relative mt-1 block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-sky-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Category, note, amount" className="w-full rounded-xl border border-sky-200 py-2.5 pl-9 pr-3 text-sm" />
          </span>
        </label>

        <label className="text-xs font-bold text-slate-600">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-sky-200 p-2.5 text-sm">
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>

        <label className="text-xs font-bold text-slate-600">
          Sort
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="mt-1 w-full rounded-xl border border-sky-200 p-2.5 text-sm">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest amount</option>
            <option value="lowest">Lowest amount</option>
          </select>
        </label>

        <label className="text-xs font-bold text-slate-600">
          From date
          <input type="date" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-xl border border-sky-200 p-2.5 text-sm" />
        </label>

        <label className="text-xs font-bold text-slate-600">
          To date
          <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-xl border border-sky-200 p-2.5 text-sm" />
        </label>

        <button onClick={clearFilters} className="self-end rounded-xl border border-sky-200 px-4 py-3 text-xs font-bold text-sky-700">
          <Filter className="mr-1 inline h-4 w-4" /> Clear filters
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">Loading expenses...</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt className="mx-auto h-10 w-10 text-sky-300" />
            <p className="mt-2 font-bold">No expense records found</p>
            <p className="mt-1 text-sm text-slate-500">Try changing filters or add an expense.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sky-50 text-xs uppercase text-sky-800">
                <tr>
                  <th className="p-4">Category</th>
                  <th className="p-4">Date / Time</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Note</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-sky-50 hover:bg-sky-50/30">
                    <td className="p-4 font-bold">{item.category_name}</td>
                    <td className="whitespace-nowrap p-4">
                      <div>{item.date}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" /> {item.time}
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-4 font-black text-rose-600">−{formatCurrency(item.amount)}</td>
                    <td className="max-w-xs p-4 text-slate-600">{item.note || '—'}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button title="Edit expense" onClick={() => openEdit(item)} className="rounded-lg p-2 text-sky-600 hover:bg-sky-50"><Edit2 className="h-4 w-4" /></button>
                        <button title="Delete expense" onClick={() => setDeleteId(item.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={submitExpense} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{editing ? 'Edit Expense' : 'Add Expense'}</h2>
              <button type="button" onClick={() => setModalOpen(false)}><X className="h-5 w-5" /></button>
            </div>

            {error && <p className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="h-4 w-4" />{error}</p>}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold">Date
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-xl border p-3" />
              </label>
              <label className="text-sm font-bold">Time
                <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full rounded-xl border p-3" />
              </label>
            </div>

            <label className="block text-sm font-bold">Category
              <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 w-full rounded-xl border p-3">
                <option value="">Select category</option>
                {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>

            <div className="flex gap-2">
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="New custom category" className="min-w-0 flex-1 rounded-xl border p-3 text-sm" />
              <button type="button" onClick={addCustomCategory} className="rounded-xl border border-sky-200 px-3 text-xs font-bold text-sky-700">Add category</button>
            </div>

            <label className="block text-sm font-bold">Amount (₹)
              <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border p-3" />
            </label>

            <label className="block text-sm font-bold">Note
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows="3" className="mt-1 w-full rounded-xl border p-3" />
            </label>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
              <button disabled={saving} className="rounded-xl bg-sky-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update expense' : 'Save expense'}</button>
            </div>
          </form>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-black">Delete expense?</h2>
            <p className="mt-2 text-sm text-slate-600">This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
              <button onClick={removeExpense} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
