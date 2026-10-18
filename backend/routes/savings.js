import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

const money = (value) =>
  Math.round(Number(value) * 100) / 100;

const validMonth = (value) =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || ''));

function getMonth(value) {
  if (validMonth(value)) return String(value);

  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;
}

function previousMonthOf(month) {
  const date = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)) - 2,
    1
  );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

function sumMonth(items, month) {
  return money(
    items
      .filter((item) =>
        String(item.date || '').startsWith(month)
      )
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      )
  );
}

// GET /api/savings/overview
router.get('/overview', (req, res) => {
  const userId = req.user.id;
  const month = getMonth(req.query.month);
  const previousMonth = previousMonthOf(month);

  const expenses = db.getExpenses(userId);
  const incomes = db.getIncomes(userId);
  const goals = db.getSavingsGoals(userId);
  const transactions = db.getSavingsTransactions(userId);

  const expenseThis = sumMonth(expenses, month);
  const incomeThis = sumMonth(incomes, month);
  const expensePrev = sumMonth(expenses, previousMonth);
  const incomePrev = sumMonth(incomes, previousMonth);

  const budgetRecord = db.getMonthlyBudget(userId, month);
  const budget = Number(budgetRecord?.amount || 0);

  const budgetOverrun =
    budget > 0
      ? money(Math.max(0, expenseThis - budget))
      : 0;

  const monthlySavings = money(incomeThis - expenseThis);
  const previousMonthlySavings = money(
    incomePrev - expensePrev
  );

  // An overrun is a warning against the monthly budget.
  // Do not deduct it twice from monthly net savings.
  // Show its effect on the available Dream Goal reserve.
  let remainingOverrun = budgetOverrun;

  const adjustedGoals = goals.map((goal) => {
    const recordedBalance = money(goal.balance || 0);
    const debit = Math.min(
      recordedBalance,
      remainingOverrun
    );

    remainingOverrun = money(
      remainingOverrun - debit
    );

    const availableBalance = money(
      recordedBalance - debit
    );

    const target = Number(goal.target_amount || 0);

    return {
      ...goal,
      recordedBalance,
      availableBalance,
      budgetOverrunApplied: money(debit),
      progress:
        target > 0
          ? Math.min(
              100,
              Math.round(
                (availableBalance / target) * 100
              )
            )
          : 0,
    };
  });

  const categoryTotals = {};

  for (const expense of expenses.filter((item) =>
    String(item.date || '').startsWith(month)
  )) {
    const name = expense.category_name || 'Uncategorized';

    categoryTotals[name] = money(
      (categoryTotals[name] || 0) +
        Number(expense.amount || 0)
    );
  }

  const previousCategoryTotals = {};

  for (const expense of expenses.filter((item) =>
    String(item.date || '').startsWith(previousMonth)
  )) {
    const name = expense.category_name || 'Uncategorized';

    previousCategoryTotals[name] = money(
      (previousCategoryTotals[name] || 0) +
        Number(expense.amount || 0)
    );
  }

  const topCategory = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0];

  const categoryInsights = Object.entries(categoryTotals)
    .map(([name, amount]) => {
      const previousAmount = Number(
        previousCategoryTotals[name] || 0
      );

      const increase = money(amount - previousAmount);

      const increasePercent =
        previousAmount > 0
          ? Math.round(
              (increase / previousAmount) * 100
            )
          : amount > 0
            ? 100
            : 0;

      return {
        name,
        amount,
        previousAmount,
        increase,
        increasePercent,
        unusualIncrease:
          amount >= 100 &&
          previousAmount > 0 &&
          increasePercent >= 50,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const recordedGoalFund = money(
    goals.reduce(
      (sum, goal) => sum + Number(goal.balance || 0),
      0
    )
  );

  res.json({
    success: true,
    data: {
      month,
      previousMonth,
      budget,
      expenseThis,
      incomeThis,
      expensePrev,
      incomePrev,

      budgetRemaining:
        budget > 0 ? money(budget - expenseThis) : null,

      budgetOverrun,
      monthlySavings,
      previousMonthlySavings,

      savingsChange: money(
        monthlySavings - previousMonthlySavings
      ),

      topCategory: topCategory
        ? {
            name: topCategory[0],
            amount: topCategory[1],
          }
        : null,

      categoryInsights,
      goals: adjustedGoals,

      goalFundRecorded: recordedGoalFund,

      goalFundAvailable: money(
        Math.max(0, recordedGoalFund - budgetOverrun)
      ),

      transactions: transactions
        .slice()
        .sort((a, b) =>
          `${b.date} ${b.created_at}`.localeCompare(
            `${a.date} ${a.created_at}`
          )
        )
        .slice(0, 10),
    },
  });
});

// PUT /api/savings/budget
router.put('/budget', (req, res) => {
  const month = String(req.body.month || '');
  const amount = Number(req.body.amount);

  if (
    !validMonth(month) ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Provide a valid month and non-negative budget amount.',
    });
  }

  const budget = db.setMonthlyBudget(
    req.user.id,
    month,
    money(amount)
  );

  res.json({ success: true, data: budget });
});

// POST /api/savings/goals
router.post('/goals', (req, res) => {
  const title = String(req.body.title || '').trim();
  const targetAmount = Number(req.body.target_amount);
  const deadline = String(req.body.deadline || '');

  if (
    !title ||
    title.length > 80 ||
    !Number.isFinite(targetAmount) ||
    targetAmount <= 0 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(deadline)
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Enter a goal name, positive target amount, and valid deadline.',
    });
  }

  const goal = db.createSavingsGoal({
    user_id: req.user.id,
    title,
    target_amount: money(targetAmount),
    deadline,
    note: String(req.body.note || '').slice(0, 240),
    balance: 0,
  });

  res.status(201).json({
    success: true,
    data: goal,
  });
});

// PUT /api/savings/goals/:id
router.put('/goals/:id', (req, res) => {
  const updates = {};

  if (req.body.title !== undefined) {
    updates.title = String(req.body.title)
      .trim()
      .slice(0, 80);
  }

  if (req.body.target_amount !== undefined) {
    const target = Number(req.body.target_amount);

    if (!Number.isFinite(target) || target <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be greater than zero.',
      });
    }

    updates.target_amount = money(target);
  }

  if (req.body.deadline !== undefined) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        String(req.body.deadline)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid deadline.',
      });
    }

    updates.deadline = req.body.deadline;
  }

  const goal = db.updateSavingsGoal(
    req.params.id,
    req.user.id,
    updates
  );

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Savings goal not found.',
    });
  }

  res.json({ success: true, data: goal });
});

// DELETE /api/savings/goals/:id
router.delete('/goals/:id', (req, res) => {
  const deleted = db.deleteSavingsGoal(
    req.params.id,
    req.user.id
  );

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Savings goal not found.',
    });
  }

  res.json({ success: true });
});

// POST /api/savings/goals/:id/transactions
router.post('/goals/:id/transactions', (req, res) => {
  const goal = db
    .getSavingsGoals(req.user.id)
    .find((item) => item.id === req.params.id);

  const amount = Number(req.body.amount);

  const type =
    req.body.type === 'withdrawal'
      ? 'withdrawal'
      : 'contribution';

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Savings goal not found.',
    });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than zero.',
    });
  }

  if (
    type === 'withdrawal' &&
    amount > Number(goal.balance || 0)
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Withdrawal cannot exceed the recorded goal balance.',
    });
  }

  const transaction = db.addSavingsTransaction({
    user_id: req.user.id,
    goal_id: goal.id,
    goal_title: goal.title,
    type,
    amount: money(amount),

    date: /^\d{4}-\d{2}-\d{2}$/.test(
      String(req.body.date || '')
    )
      ? req.body.date
      : new Date().toISOString().slice(0, 10),

    note: String(req.body.note || '').slice(0, 240),
  });

  res.status(201).json({
    success: true,
    data: transaction,
  });
});

export default router;