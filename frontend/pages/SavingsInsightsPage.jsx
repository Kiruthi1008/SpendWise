import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Goal,
  PiggyBank,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { api } from '../services/api.js';

const today = new Date();

const currentMonth =
  `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, '0')}`;

const todayString =
  `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const monthName = (value) =>
  new Date(`${value}-01T12:00:00`).toLocaleDateString(
    'en-IN',
    {
      month: 'long',
      year: 'numeric',
    }
  );

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'sky',
}) {
  const tones = {
    sky: 'bg-sky-50 text-sky-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </p>
        </div>

        <span
          className={`rounded-xl p-2.5 ${
            tones[tone] || tones.sky
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      {detail && (
        <p className="mt-2 text-xs text-slate-500">
          {detail}
        </p>
      )}
    </div>
  );
}

const emptyGoalForm = {
  title: '',
  target_amount: '',
  deadline: '',
  note: '',
};

export const SavingsInsightsPage = () => {
  const [month, setMonth] = useState(currentMonth);
  const [overview, setOverview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [budgetAmount, setBudgetAmount] = useState('');
  const [goalForm, setGoalForm] = useState(emptyGoalForm);

  const [transactionForms, setTransactionForms] =
    useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api.getSavingsOverview(month);

      setOverview(result.data);
      setBudgetAmount(String(result.data.budget || ''));
    } catch (err) {
      setError(
        err.message || 'Unable to load savings insights.'
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBudget = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api.setMonthlyBudget(
        month,
        Number(budgetAmount)
      );

      setNotice('Monthly budget saved.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGoal = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api.createSavingsGoal({
        ...goalForm,
        target_amount: Number(goalForm.target_amount),
      });

      setGoalForm(emptyGoalForm);
      setNotice('Dream goal created.');

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTransaction = async (event, goal) => {
    event.preventDefault();

    const form = transactionForms[goal.id] || {
      type: 'contribution',
      amount: '',
      note: '',
    };

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api.addSavingsTransaction(goal.id, {
        ...form,
        amount: Number(form.amount),
        date: todayString,
      });

      setTransactionForms((current) => ({
        ...current,
        [goal.id]: {
          type: 'contribution',
          amount: '',
          note: '',
        },
      }));

      setNotice(
        `${form.type === 'withdrawal' ? 'Withdrawal' : 'Contribution'} recorded for ${goal.title}.`
      );

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (goal) => {
    const confirmed = window.confirm(
      `Archive the dream goal "${goal.title}"? Its transaction history will be retained.`
    );

    if (!confirmed) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api.deleteSavingsGoal(goal.id);

      setNotice('Dream goal archived.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const savingsChangeText = useMemo(() => {
    if (!overview) return '';

    if (overview.savingsChange > 0) {
      return `${money(overview.savingsChange)} more saved than last month`;
    }

    if (overview.savingsChange < 0) {
      return `${money(Math.abs(overview.savingsChange))} less saved than last month`;
    }

    return 'Same savings as last month';
  }, [overview]);

  if (loading && !overview) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-semibold text-slate-500">
        <RefreshCw className="h-5 w-5 animate-spin" />
        Loading your goals and insights...
      </div>
    );
  }

  const budgetUsedPercent =
    overview?.budget > 0
      ? Math.round(
          (overview.expenseThis / overview.budget) * 100
        )
      : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-extrabold text-sky-700">
            <ChartNoAxesCombined className="h-3.5 w-3.5" />
            SAVINGS & SPENDING
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Dream Goals & Insights
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Make everyday spending work toward the things you dream of.
          </p>
        </div>

        <label className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 sm:self-auto">
          <CalendarDays className="h-4 w-4 text-sky-600" />

          <span className="sr-only">Choose month</span>

          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="bg-transparent outline-none"
          />
        </label>
      </div>

      {/* Error and success messages */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
        >
          {notice}
        </div>
      )}

      {/* Summary cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Monthly savings"
          value={money(overview?.monthlySavings)}
          detail={savingsChangeText}
          icon={PiggyBank}
          tone={
            Number(overview?.monthlySavings) >= 0
              ? 'green'
              : 'rose'
          }
        />

        <StatCard
          label="Spending this month"
          value={money(overview?.expenseThis)}
          detail={`Income: ${money(overview?.incomeThis)}`}
          icon={Wallet}
        />

        <StatCard
          label="Budget remaining"
          value={
            overview?.budgetRemaining === null
              ? 'Not set'
              : money(overview?.budgetRemaining)
          }
          detail={
            overview?.budget > 0
              ? `Budget: ${money(overview.budget)}`
              : 'Set a monthly budget below'
          }
          icon={CircleDollarSign}
          tone={
            Number(overview?.budgetRemaining) < 0
              ? 'rose'
              : 'sky'
          }
        />

        <StatCard
          label="Dream fund available"
          value={money(overview?.goalFundAvailable)}
          detail={
            Number(overview?.budgetOverrun) > 0
              ? `${money(overview.budgetOverrun)} budget overrun reduces available goal funds`
              : 'After recorded goal transactions'
          }
          icon={Target}
          tone="green"
        />
      </section>

      {/* Budget and goal creation */}
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Monthly budget */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-xl bg-sky-100 p-2.5 text-sky-700">
              <Wallet className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-black text-slate-900">
                Monthly spending budget
              </h2>

              <p className="text-xs text-slate-500">
                {monthName(month)}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleBudget}
            className="space-y-3"
          >
            <label className="block text-xs font-bold text-slate-600">
              Budget amount (₹)

              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={budgetAmount}
                onChange={(event) =>
                  setBudgetAmount(event.target.value)
                }
                placeholder="e.g. 20000"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <button
              disabled={saving}
              className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save monthly budget'}
            </button>
          </form>

          {overview?.budget > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs font-bold">
                <span className="text-slate-600">
                  Budget used
                </span>

                <span
                  className={
                    overview.expenseThis > overview.budget
                      ? 'text-rose-600'
                      : 'text-slate-700'
                  }
                >
                  {budgetUsedPercent}%
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    overview.expenseThis > overview.budget
                      ? 'bg-rose-500'
                      : overview.expenseThis / overview.budget >= 0.8
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, budgetUsedPercent)}%`,
                  }}
                />
              </div>

              {overview.budgetOverrun > 0 ? (
                <p className="mt-3 flex items-start gap-2 text-xs font-semibold text-rose-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  You exceeded this month's budget by{' '}
                  {money(overview.budgetOverrun)}. Available Dream
                  Goal funds are reduced by this amount, up to the
                  fund balance.
                </p>
              ) : overview.expenseThis / overview.budget >= 0.8 ? (
                <p className="mt-3 text-xs font-semibold text-amber-700">
                  You have used at least 80% of this month's budget.
                </p>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  You are within your spending budget.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Create goal */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-xl bg-violet-100 p-2.5 text-violet-700">
              <Goal className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-black text-slate-900">
                Create a Dream Goal
              </h2>

              <p className="text-xs text-slate-500">
                Laptop, emergency fund, vacation — your choice.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleGoal}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label className="text-xs font-bold text-slate-600 sm:col-span-2">
              Goal name

              <input
                required
                maxLength={80}
                value={goalForm.title}
                onChange={(event) =>
                  setGoalForm({
                    ...goalForm,
                    title: event.target.value,
                  })
                }
                placeholder="e.g. New laptop"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="text-xs font-bold text-slate-600">
              Target amount (₹)

              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={goalForm.target_amount}
                onChange={(event) =>
                  setGoalForm({
                    ...goalForm,
                    target_amount: event.target.value,
                  })
                }
                placeholder="75000"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="text-xs font-bold text-slate-600">
              Deadline

              <input
                type="date"
                min={todayString}
                required
                value={goalForm.deadline}
                onChange={(event) =>
                  setGoalForm({
                    ...goalForm,
                    deadline: event.target.value,
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="text-xs font-bold text-slate-600 sm:col-span-2">
              Note (optional)

              <input
                maxLength={240}
                value={goalForm.note}
                onChange={(event) =>
                  setGoalForm({
                    ...goalForm,
                    note: event.target.value,
                  })
                }
                placeholder="Why this goal matters to you"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <button
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-violet-700 disabled:opacity-60 sm:col-span-2"
            >
              <Plus className="h-4 w-4" />
              Create dream goal
            </button>
          </form>
        </div>
      </section>

      {/* Dream Goals */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-900">
            Your Dream Goals
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Contributions increase a goal; withdrawals decrease it.
            Budget overruns reduce available funds without double-counting
            monthly expenses.
          </p>
        </div>

        {!overview?.goals?.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Target className="mx-auto h-9 w-9 text-slate-300" />

            <h3 className="mt-3 font-extrabold text-slate-800">
              Your first dream starts here
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Create a goal above and start recording contributions.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {overview.goals.map((goal) => {
              const remaining = Math.max(
                0,
                Number(goal.target_amount) -
                  Number(goal.availableBalance)
              );

              const progress =
                goal.target_amount > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (Number(goal.availableBalance) /
                          Number(goal.target_amount)) *
                          100
                      )
                    )
                  : 0;

              const form = transactionForms[goal.id] || {
                type: 'contribution',
                amount: '',
                note: '',
              };

              const days = Math.max(
                1,
                Math.ceil(
                  (new Date(`${goal.deadline}T00:00:00`) -
                    new Date(`${todayString}T00:00:00`)) /
                    86400000
                )
              );

              const monthsRemaining = Math.max(
                1,
                Math.ceil(days / 30.4375)
              );

              const monthlyNeeded =
                remaining / monthsRemaining;

              return (
                <article
                  key={goal.id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                        <Target className="h-5 w-5" />
                      </span>

                      <div className="min-w-0">
                        <h3 className="break-words font-black text-slate-900">
                          {goal.title}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Target date:{' '}
                          {new Date(
                            `${goal.deadline}T12:00:00`
                          ).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(goal)}
                      title="Archive goal"
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        Available toward goal
                      </p>

                      <p className="mt-1 text-2xl font-black text-slate-900">
                        {money(goal.availableBalance)}
                      </p>
                    </div>

                    <p className="text-right text-xs font-bold text-slate-500">
                      of {money(goal.target_amount)}
                      <br />
                      <span className="text-emerald-600">
                        {progress}% saved
                      </span>
                    </p>
                  </div>

                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                    <span>{money(remaining)} left to goal</span>

                    <span>
                      Save about {money(monthlyNeeded)}/month
                    </span>
                  </div>

                  {goal.budgetOverrunApplied > 0 && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      {money(goal.budgetOverrunApplied)} temporarily
                      allocated to this month's budget overrun.
                    </p>
                  )}

                  <form
                    onSubmit={(event) =>
                      handleTransaction(event, goal)
                    }
                    className="mt-4 grid grid-cols-2 gap-2"
                  >
                    <select
                      aria-label={`Transaction type for ${goal.title}`}
                      value={form.type}
                      onChange={(event) =>
                        setTransactionForms((old) => ({
                          ...old,
                          [goal.id]: {
                            ...form,
                            type: event.target.value,
                          },
                        }))
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-sky-400"
                    >
                      <option value="contribution">
                        Add contribution
                      </option>

                      <option value="withdrawal">
                        Withdraw money
                      </option>
                    </select>

                    <input
                      aria-label={`Amount for ${goal.title}`}
                      required
                      type="number"
                      min="0.01"
                      max={
                        form.type === 'withdrawal'
                          ? goal.recordedBalance
                          : undefined
                      }
                      step="0.01"
                      value={form.amount}
                      onChange={(event) =>
                        setTransactionForms((old) => ({
                          ...old,
                          [goal.id]: {
                            ...form,
                            amount: event.target.value,
                          },
                        }))
                      }
                      placeholder="Amount ₹"
                      className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-sky-400"
                    />

                    <input
                      aria-label={`Note for ${goal.title}`}
                      value={form.note}
                      onChange={(event) =>
                        setTransactionForms((old) => ({
                          ...old,
                          [goal.id]: {
                            ...form,
                            note: event.target.value,
                          },
                        }))
                      }
                      placeholder="Note (optional)"
                      className="col-span-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-sky-400"
                    />

                    <button
                      disabled={saving}
                      className="col-span-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-extrabold text-white hover:bg-slate-700 disabled:opacity-60"
                    >
                      Record{' '}
                      {form.type === 'withdrawal'
                        ? 'withdrawal'
                        : 'contribution'}
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Month-on-month savings comparison */}
      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-black text-slate-900">
            Month-on-month comparison
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {monthName(month)} compared with{' '}
            {monthName(overview?.previousMonth || month)}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">
                This month saved
              </p>

              <p
                className={`mt-2 text-lg font-black ${
                  overview?.monthlySavings < 0
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }`}
              >
                {money(overview?.monthlySavings)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">
                Last month saved
              </p>

              <p
                className={`mt-2 text-lg font-black ${
                  overview?.previousMonthlySavings < 0
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }`}
              >
                {money(overview?.previousMonthlySavings)}
              </p>
            </div>
          </div>

          <div
            className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-sm font-bold ${
              overview?.savingsChange >= 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {overview?.savingsChange >= 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}

            {savingsChangeText}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500">
                Expenses last month
              </p>

              <p className="mt-1 font-extrabold text-slate-800">
                {money(overview?.expensePrev)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Expenses this month
              </p>

              <p className="mt-1 font-extrabold text-slate-800">
                {money(overview?.expenseThis)}
              </p>
            </div>
          </div>
        </div>

        {/* Spending insights */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-black text-slate-900">
            Spending insights
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Category patterns from your recorded expenses.
          </p>

          {overview?.topCategory ? (
            <div className="mt-4 rounded-xl bg-sky-50 p-4">
              <p className="text-xs font-bold text-sky-700">
                Highest-spending category
              </p>

              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="font-black text-slate-900">
                  {overview.topCategory.name}
                </p>

                <p className="text-lg font-black text-sky-700">
                  {money(overview.topCategory.amount)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              No expenses recorded for this month yet.
            </p>
          )}

          {overview?.categoryInsights?.length > 0 && (
            <div className="mt-4 space-y-3">
              {overview.categoryInsights
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-700">
                        {item.name}
                      </p>

                      <p className="text-[11px] text-slate-500">
                        Previous: {money(item.previousAmount)} ·
                        Current: {money(item.amount)}
                      </p>
                    </div>

                    <div
                      className={`shrink-0 text-right text-xs font-extrabold ${
                        item.increase > 0
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {item.increase > 0 ? (
                        <TrendingUp className="mb-0.5 inline h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="mb-0.5 inline h-3.5 w-3.5" />
                      )}

                      {' '}
                      {item.increase > 0 ? '+' : ''}
                      {item.increasePercent}%
                    </div>

                    {item.unusualIncrease && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">
                        Unusual rise
                      </span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      <p className="text-xs leading-relaxed text-slate-400">
        Savings are calculated as income minus actual expenses.
        Budget overruns reduce the displayed available Dream Goal
        reserve, capped at the recorded goal balances. Contributions
        and withdrawals are retained in the transaction history.
      </p>
    </div>
  );
};

export default SavingsInsightsPage;