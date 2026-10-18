import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  Trash2,
  Edit2,
  CheckCircle2,
  Bell,
  Search,
  X,
  AlertCircle,
  ArrowUpDown,
  Circle,
  Flame,
} from 'lucide-react';
import { api } from '../services/api.js';

export const TodosPage = ({ initialOpenAdd = false }) => {
  const [todos, setTodos] = useState([]);
  const [summary, setSummary] = useState({
    overdueCount: 0,
    dueTodayCount: 0,
    dueSoonCount: 0,
    urgentPriorityCount: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(initialOpenAdd);
  const [editingTodo, setEditingTodo] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [formTitle, setFormTitle] = useState('');
  const [formDueDate, setFormDueDate] = useState(todayStr);
  const [formDueTime, setFormDueTime] = useState('18:00');
  const [formPriority, setFormPriority] = useState('High');
  const [formCategory, setFormCategory] = useState('Bill Payment');
  const [formAmount, setFormAmount] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await api.getTodos();
      if (res.success) {
        setTodos(res.todos);
        setSummary(res.notificationSummary);
      }
    } catch (err) {
      console.error('Failed to load to-do list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const openAddModal = () => {
    setEditingTodo(null);
    setFormTitle('');
    setFormDueDate(todayStr);
    setFormDueTime('18:00');
    setFormPriority('High');
    setFormCategory('Bill Payment');
    setFormAmount('');
    setFormNote('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (todo) => {
    setEditingTodo(todo);
    setFormTitle(todo.title);
    setFormDueDate(todo.due_date);
    setFormDueTime(todo.due_time || '18:00');
    setFormPriority(todo.priority);
    setFormCategory(todo.category || 'Bill Payment');
    setFormAmount(todo.amount !== undefined && todo.amount !== null ? todo.amount.toString() : '');
    setFormNote(todo.note || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim() || !formDueDate) {
      setFormError('Please provide task title and deadline date.');
      return;
    }

    try {
      setFormSubmitting(true);
      const numAmount = formAmount ? parseFloat(formAmount) : null;

      if (editingTodo) {
        const res = await api.updateTodo(editingTodo.id, {
          title: formTitle.trim(),
          due_date: formDueDate,
          due_time: formDueTime,
          priority: formPriority,
          category: formCategory,
          amount: numAmount,
          note: formNote,
        });
        if (res.success) {
          setTodos((prev) => prev.map((t) => (t.id === editingTodo.id ? res.todo : t)));
          setIsModalOpen(false);
        }
      } else {
        const res = await api.createTodo({
          title: formTitle.trim(),
          due_date: formDueDate,
          due_time: formDueTime,
          priority: formPriority,
          category: formCategory,
          amount: numAmount,
          note: formNote,
        });
        if (res.success) {
          setTodos((prev) => [res.todo, ...prev]);
          setIsModalOpen(false);
        }
      }
      fetchTodos();
    } catch (err) {
      setFormError(err.message || 'Failed to save to-do.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleComplete = async (id) => {
    try {
      const res = await api.toggleTodo(id);
      if (res.success) {
        setTodos((prev) => prev.map((t) => (t.id === id ? res.todo : t)));
        fetchTodos();
      }
    } catch (err) {
      alert(err.message || 'Failed to update task.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.deleteTodo(id);
      if (res.success) {
        setTodos((prev) => prev.filter((t) => t.id !== id));
        setDeleteConfirmId(null);
        fetchTodos();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  const applyPreset = (presetTitle, presetCat, presetPriority) => {
    setFormTitle(presetTitle);
    setFormCategory(presetCat);
    setFormPriority(presetPriority);
  };

  const getDeadlineStatus = (dueDate, dueTime, completed) => {
    if (completed) {
      return { status: 'completed', label: 'Completed', color: 'text-slate-400 bg-slate-100 border-slate-200' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = dueDate.split('-').map(Number);
    const taskDate = new Date(y, m - 1, d);
    taskDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'overdue',
        label: `OVERDUE (${Math.abs(diffDays)}d)`,
        color: 'text-rose-700 bg-rose-50 border-rose-200 font-extrabold animate-pulse',
      };
    } else if (diffDays === 0) {
      return {
        status: 'today',
        label: `DUE TODAY (${dueTime || 'EOD'})`,
        color: 'text-sky-800 bg-sky-100 border-sky-300 font-black',
      };
    } else if (diffDays === 1) {
      return {
        status: 'tomorrow',
        label: 'Due Tomorrow',
        color: 'text-sky-700 bg-sky-50 border-sky-200 font-bold',
      };
    } else if (diffDays <= 3) {
      return {
        status: 'soon',
        label: `Due in ${diffDays} days`,
        color: 'text-sky-600 bg-sky-50/60 border-sky-200 font-semibold',
      };
    } else {
      return {
        status: 'upcoming',
        label: `Due ${dueDate}`,
        color: 'text-slate-600 bg-slate-50 border-slate-200 font-medium',
      };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
            <Flame className="w-3 h-3 text-rose-500" /> Urgent
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            High Priority
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  const filteredTodos = todos.filter((t) => {
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'completed') return t.completed;
    if (activeFilter === 'urgent') return !t.completed && (t.priority === 'Urgent' || t.priority === 'High');
    if (activeFilter === 'dueSoon') {
      if (t.completed) return false;
      const d = getDeadlineStatus(t.due_date, t.due_time, false);
      return d.status === 'overdue' || d.status === 'today' || d.status === 'tomorrow' || d.status === 'soon';
    }
    return true;
  });

  const priorityWeight = {
    Urgent: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  filteredTodos.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (sortBy === 'priority') {
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return a.due_date.localeCompare(b.due_date);
    }
    return a.due_date.localeCompare(b.due_date);
  });

  const completedCount = todos.filter((t) => t.completed).length;
  const completionPercentage = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Financial To-Dos & Deadlines
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Manage upcoming bill payments, EMIs, and receive deadline notification alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs shadow-md shadow-sky-500/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New To-Do</span>
          </button>
        </div>
      </div>

      {/* Prominent Deadline Notification Banner */}
      {(summary.overdueCount > 0 || summary.dueTodayCount > 0) && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-sky-100 flex items-center gap-2">
                <span>Deadline Notification Alert</span>
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black uppercase">
                  Action Required
                </span>
              </p>
              <p className="text-xs font-bold text-white mt-0.5">
                {summary.overdueCount > 0 && (
                  <span className="underline decoration-white mr-2">
                    🚨 {summary.overdueCount} task{summary.overdueCount > 1 ? 's' : ''} overdue!
                  </span>
                )}
                {summary.dueTodayCount > 0 && (
                  <span>⚡ {summary.dueTodayCount} payment deadline{summary.dueTodayCount > 1 ? 's' : ''} due today.</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveFilter('dueSoon')}
            className="px-4 py-2 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-black text-xs shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Filter Near Deadlines
          </button>
        </div>
      )}

      {/* KPI Cards in White & Sky Blue */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveFilter('dueSoon')}
          className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5 cursor-pointer hover:border-rose-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Overdue</span>
            <AlertCircle className={`w-4 h-4 ${summary.overdueCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <p className="text-2xl font-black text-rose-500 mt-1">{summary.overdueCount}</p>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Missed cutoff</p>
        </div>

        <div
          onClick={() => setActiveFilter('dueSoon')}
          className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5 cursor-pointer hover:border-sky-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Due Today</span>
            <Clock className={`w-4 h-4 ${summary.dueTodayCount > 0 ? 'text-sky-600' : 'text-slate-400'}`} />
          </div>
          <p className="text-2xl font-black text-sky-600 mt-1">{summary.dueTodayCount}</p>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Within 24 hours</p>
        </div>

        <div
          onClick={() => setActiveFilter('urgent')}
          className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5 cursor-pointer hover:border-sky-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Urgent Priority</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{summary.urgentPriorityCount}</p>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Critical tasks</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-sky-600 mt-1">{completionPercentage}%</p>
          <div className="mt-1 w-full bg-sky-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Sorting Bar */}
      <div className="bg-white p-4 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search to-dos, bills, notes..."
            className="w-full pl-10 pr-4 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </div>

        <div className="flex items-center flex-wrap gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-sky-50/60 text-slate-600 hover:bg-sky-100'
            }`}
          >
            All ({todos.length})
          </button>
          <button
            onClick={() => setActiveFilter('dueSoon')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeFilter === 'dueSoon'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-sky-50/60 text-slate-600 hover:bg-sky-100'
            }`}
          >
            ⚡ Due Soon ({summary.totalPending})
          </button>
          <button
            onClick={() => setActiveFilter('urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeFilter === 'urgent'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-sky-50/60 text-slate-600 hover:bg-sky-100'
            }`}
          >
            🔥 High Priority
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeFilter === 'completed'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-sky-50/60 text-slate-600 hover:bg-sky-100'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ArrowUpDown className="w-3.5 h-3.5 text-sky-500" />
          <span className="font-bold">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-sky-50/50 border border-sky-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="deadline">Closest Deadline</option>
            <option value="priority">Priority First</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading to-do items...</div>
        ) : filteredTodos.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-sky-100 text-center shadow-xs">
            <CheckSquare className="w-12 h-12 mx-auto text-sky-200 mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No tasks found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Add upcoming bills, loan EMIs, or tax deadlines to receive notifications.
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs shadow-xs cursor-pointer"
            >
              + Create First Task
            </button>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const deadline = getDeadlineStatus(todo.due_date, todo.due_time, todo.completed);
            return (
              <div
                key={todo.id}
                className={`p-4 sm:p-5 rounded-3xl bg-white border transition-all ${
                  todo.completed
                    ? 'border-slate-200 opacity-60'
                    : deadline.status === 'overdue'
                    ? 'border-rose-300 shadow-md shadow-rose-500/5 ring-1 ring-rose-200'
                    : deadline.status === 'today'
                    ? 'border-sky-300 shadow-md shadow-sky-500/10 ring-1 ring-sky-300'
                    : 'border-sky-100 shadow-sm shadow-sky-500/5 hover:border-sky-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 flex-1">
                    <button
                      onClick={() => handleToggleComplete(todo.id)}
                      className="mt-0.5 p-1 rounded-xl hover:bg-sky-50 text-slate-400 hover:text-sky-600 transition cursor-pointer"
                      title={todo.completed ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-sky-600 fill-sky-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-sm font-bold ${
                            todo.completed ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {todo.title}
                        </span>

                        {getPriorityBadge(todo.priority)}

                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                          {todo.category}
                        </span>

                        {todo.amount !== undefined && todo.amount !== null && (
                          <span className="text-xs font-black text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                            ${Number(todo.amount).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${deadline.color}`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{deadline.label}</span>
                        </span>

                        <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-sky-400" />
                          <span>Target: {todo.due_date} at {todo.due_time}</span>
                        </span>
                      </div>

                      {todo.note && (
                        <p className="text-xs text-slate-500 font-medium mt-2 bg-sky-50/30 p-2.5 rounded-2xl border border-sky-100">
                          {todo.note}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(todo)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(todo.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL: ADD / EDIT TO-DO ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-sky-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-sky-500" />
                {editingTodo ? 'Edit Financial Task' : 'Add Financial To-Do'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-sky-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {!editingTodo && (
              <div className="mt-4">
                <p className="text-[11px] font-black text-sky-700 uppercase tracking-wider mb-2">
                  Quick Presets
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('Pay Electricity & Water Bill', 'Bill Payment', 'Urgent')}
                    className="px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold cursor-pointer"
                  >
                    💡 Utility Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('Pay Credit Card Statement Balance', 'Debt & Loan', 'High')}
                    className="px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold cursor-pointer"
                  >
                    💳 Credit Card Due
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('Transfer Monthly SIP Investment', 'Savings / Investment', 'Medium')}
                    className="px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold cursor-pointer"
                  >
                    📈 Investment SIP
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Pay Apartment Maintenance & WiFi"
                  required
                  className="w-full px-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deadline Date *
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="Urgent">🔥 Urgent Priority</option>
                    <option value="High">⚡ High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="Bill Payment">Bill Payment</option>
                    <option value="Debt & Loan">Debt & Loan</option>
                    <option value="Savings / Investment">Savings / Investment</option>
                    <option value="Tax & Compliance">Tax & Compliance</option>
                    <option value="Expense Audit">Expense Audit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payable Amount ($) (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-sky-500 text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note / Action Memo
                </label>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="e.g. Account number, confirmation link..."
                  rows={2}
                  className="w-full px-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-sky-50 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black text-xs shadow-md shadow-sky-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingTodo ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-sky-100">
            <h3 className="text-base font-black text-slate-900">Delete Task?</h3>
            <p className="text-xs text-slate-500 font-medium mt-2">
              Are you sure you want to remove this financial task? You will no longer receive deadline notifications for it.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-sky-50 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
