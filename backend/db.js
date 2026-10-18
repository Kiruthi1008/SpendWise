
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'backend/data');
const DATA_FILE = path.join(DATA_DIR, 'spendwise_data.json');

const DEFAULT_EXPENSE_CATEGORIES = [
  { user_id: null, name: 'Food & Dining', icon: 'Utensils', color: '#0ea5e9', is_custom: false },
  { user_id: null, name: 'Housing & Rent', icon: 'Home', color: '#6366f1', is_custom: false },
  { user_id: null, name: 'Utilities & Bills', icon: 'Zap', color: '#eab308', is_custom: false },
  { user_id: null, name: 'Transportation', icon: 'Car', color: '#0284c7', is_custom: false },
  { user_id: null, name: 'Health & Fitness', icon: 'HeartPulse', color: '#ec4899', is_custom: false },
  { user_id: null, name: 'Entertainment', icon: 'Film', color: '#8b5cf6', is_custom: false },
  { user_id: null, name: 'Shopping & Groceries', icon: 'ShoppingBag', color: '#14b8a6', is_custom: false },
  { user_id: null, name: 'Education', icon: 'GraduationCap', color: '#06b6d4', is_custom: false },
  { user_id: null, name: 'Miscellaneous', icon: 'Tag', color: '#64748b', is_custom: false },
];

const DEFAULT_INCOME_SOURCES = [
  { user_id: null, name: 'Salary', icon: 'Briefcase', color: '#0284c7', is_custom: false },
  { user_id: null, name: 'Freelance & Contract', icon: 'Laptop', color: '#0ea5e9', is_custom: false },
  { user_id: null, name: 'Business Profits', icon: 'TrendingUp', color: '#0369a1', is_custom: false },
  { user_id: null, name: 'Investments & Dividends', icon: 'PiggyBank', color: '#38bdf8', is_custom: false },
  { user_id: null, name: 'Rental Property', icon: 'Building', color: '#7c3aed', is_custom: false },
  { user_id: null, name: 'Gifts & Awards', icon: 'Gift', color: '#d946ef', is_custom: false },
  { user_id: null, name: 'Other Income', icon: 'Coins', color: '#64748b', is_custom: false },
];

class Database {
  constructor() {
    this.data = {
      users: [],
      expense_categories: [],
      income_sources: [],
      expenses: [],
      incomes: [],
      financial_todos: [],
      monthly_budgets: [],
      savings_goals: [],
      savings_transactions: [],
    };

    this.init();
  }

  init() {
    fs.mkdirSync(DATA_DIR, { recursive: true });

    if (fs.existsSync(DATA_FILE)) {
      try {
        this.data = JSON.parse(
          fs.readFileSync(DATA_FILE, 'utf-8')
        );
      } catch (err) {
        console.error('Error reading database file:', err);
        throw new Error(
          `Could not read ${DATA_FILE}. Back up the file and repair its JSON before restarting.`
        );
      }
    } else {
      this.seedDefaultData();
    }

    // Add new collections without deleting existing user data.
    this.data.users ||= [];
    this.data.expense_categories ||= [];
    this.data.income_sources ||= [];
    this.data.expenses ||= [];
    this.data.incomes ||= [];
    this.data.financial_todos ||= [];
    this.data.monthly_budgets ||= [];
    this.data.savings_goals ||= [];
    this.data.savings_transactions ||= [];

    if (this.data.financial_todos.length === 0) {
      this.seedDefaultTodos();
    }

    this.save();
  }

  seedDefaultTodos() {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 5);

    const now = new Date().toISOString();

    this.data.financial_todos = [
      {
        id: crypto.randomUUID(),
        user_id: 'demo-user-1',
        title: 'Pay High-Speed Internet & WiFi Bill',
        due_date: todayStr,
        due_time: '18:00',
        priority: 'Urgent',
        category: 'Bill Payment',
        amount: 85,
        completed: false,
        note: 'Pay via provider portal before late fee cutoff.',
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        user_id: 'demo-user-1',
        title: 'Pay Credit Card Statement Outstanding Balance',
        due_date: tomorrow.toISOString().slice(0, 10),
        due_time: '23:59',
        priority: 'High',
        category: 'Debt & Loan',
        amount: 420.5,
        completed: false,
        note: 'Pay the statement balance before the due date.',
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        user_id: 'demo-user-1',
        title: 'Transfer Monthly Savings',
        due_date: nextWeek.toISOString().slice(0, 10),
        due_time: '10:00',
        priority: 'Medium',
        category: 'Savings / Investment',
        amount: 675,
        completed: false,
        note: 'Transfer the planned savings contribution.',
        created_at: now,
        updated_at: now,
      },
    ];

    this.save();
  }

  seedDefaultData() {
    const passwordHash = bcrypt.hashSync(
      'Password123!',
      bcrypt.genSaltSync(10)
    );

    const now = new Date().toISOString();

    const demoUser = {
      id: 'demo-user-1',
      name: 'Alex Morgan',
      username: 'alexmorgan',
      email: 'alex.morgan@example.com',
      mobile: '+1987654321',
      gender: 'Male',
      dob: '1995-08-14',
      password_hash: passwordHash,
      created_at: now,
      updated_at: now,
    };

    this.data.users = [demoUser];

    this.data.expense_categories =
      DEFAULT_EXPENSE_CATEGORIES.map((category) => ({
        id: crypto.randomUUID(),
        ...category,
        created_at: now,
      }));

    this.data.income_sources =
      DEFAULT_INCOME_SOURCES.map((source) => ({
        id: crypto.randomUUID(),
        ...source,
        created_at: now,
      }));

    const categoryId = (name) =>
      this.data.expense_categories.find(
        (item) => item.name === name
      )?.id;

    const sourceId = (name) =>
      this.data.income_sources.find(
        (item) => item.name === name
      )?.id;

    const year = new Date().getFullYear();
    const month = String(
      new Date().getMonth() + 1
    ).padStart(2, '0');

    this.data.incomes = [
      {
        id: crypto.randomUUID(),
        user_id: demoUser.id,
        date: `${year}-${month}-01`,
        time: '09:00',
        source_id: sourceId('Salary'),
        source_name: 'Salary',
        amount: 4500,
        note: 'Monthly salary disbursement',
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        user_id: demoUser.id,
        date: `${year}-${month}-10`,
        time: '14:30',
        source_id: sourceId('Freelance & Contract'),
        source_name: 'Freelance & Contract',
        amount: 850,
        note: 'Freelance project income',
        created_at: now,
        updated_at: now,
      },
    ];

    this.data.expenses = [
      {
        id: crypto.randomUUID(),
        user_id: demoUser.id,
        date: `${year}-${month}-02`,
        time: '11:15',
        category_id: categoryId('Housing & Rent'),
        category_name: 'Housing & Rent',
        amount: 1400,
        note: 'Monthly rent',
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        user_id: demoUser.id,
        date: `${year}-${month}-04`,
        time: '18:45',
        category_id: categoryId('Food & Dining'),
        category_name: 'Food & Dining',
        amount: 86.5,
        note: 'Groceries',
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        user_id: demoUser.id,
        date: `${year}-${month}-06`,
        time: '10:00',
        category_id: categoryId('Utilities & Bills'),
        category_name: 'Utilities & Bills',
        amount: 115,
        note: 'Internet and electricity',
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        user_id: demoUser.id,
        date: `${year}-${month}-08`,
        time: '16:20',
        category_id: categoryId('Transportation'),
        category_name: 'Transportation',
        amount: 55,
        note: 'Travel',
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        user_id: demoUser.id,
        date: `${year}-${month}-12`,
        time: '19:30',
        category_id: categoryId('Shopping & Groceries'),
        category_name: 'Shopping & Groceries',
        amount: 120.75,
        note: 'Shopping',
        created_at: now,
        updated_at: now,
      },
    ];

    this.data.financial_todos = [];
    this.seedDefaultTodos();
    this.save();
  }

  save() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });

      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(this.data, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('Failed to persist database state:', err);
      throw err;
    }
  }

  // ---------------- USERS ----------------

  getUsers() {
    return this.data.users;
  }

  findUserById(id) {
    return this.data.users.find((user) => user.id === id);
  }

  findUserByEmailOrMobile(identifier) {
    const cleanId = String(identifier || '')
      .trim()
      .toLowerCase();

    const cleanMobile = String(identifier || '').trim();

    return this.data.users.find(
      (user) =>
        String(user.email || '').toLowerCase() === cleanId ||
        String(user.mobile || '') === cleanMobile ||
        String(user.username || '').toLowerCase() === cleanId
    );
  }

  createUser(userData) {
    const now = new Date().toISOString();

    const user = {
      id: crypto.randomUUID(),
      ...userData,
      created_at: now,
      updated_at: now,
    };

    this.data.users.push(user);
    this.save();

    return user;
  }

  updateUser(id, updates) {
    const user = this.findUserById(id);
    if (!user) return null;

    Object.assign(user, updates, {
      updated_at: new Date().toISOString(),
    });

    this.save();
    return user;
  }

  // ---------------- EXPENSE CATEGORIES ----------------

  getExpenseCategories(userId) {
    return this.data.expense_categories.filter(
      (category) =>
        category.user_id === null ||
        category.user_id === userId
    );
  }

  addExpenseCategory(
    userId,
    name,
    icon = 'Tag',
    color = '#0284c7'
  ) {
    const category = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: name.trim(),
      icon,
      color,
      is_custom: true,
      created_at: new Date().toISOString(),
    };

    this.data.expense_categories.push(category);
    this.save();

    return category;
  }

  // ---------------- INCOME SOURCES ----------------

  getIncomeSources(userId) {
    return this.data.income_sources.filter(
      (source) =>
        source.user_id === null ||
        source.user_id === userId
    );
  }

  addIncomeSource(
    userId,
    name,
    icon = 'Coins',
    color = '#0284c7'
  ) {
    const source = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: name.trim(),
      icon,
      color,
      is_custom: true,
      created_at: new Date().toISOString(),
    };

    this.data.income_sources.push(source);
    this.save();

    return source;
  }

  // ---------------- EXPENSES ----------------

  getExpenses(userId) {
    return this.data.expenses.filter(
      (expense) => expense.user_id === userId
    );
  }

  getExpenseById(id, userId) {
    return this.data.expenses.find(
      (expense) =>
        expense.id === id &&
        expense.user_id === userId
    );
  }

  createExpense(expense) {
    const now = new Date().toISOString();

    const item = {
      id: crypto.randomUUID(),
      ...expense,
      created_at: now,
      updated_at: now,
    };

    this.data.expenses.push(item);
    this.save();

    return item;
  }

  updateExpense(id, userId, updates) {
    const item = this.getExpenseById(id, userId);
    if (!item) return null;

    Object.assign(item, updates, {
      updated_at: new Date().toISOString(),
    });

    this.save();
    return item;
  }

  deleteExpense(id, userId) {
    const originalLength = this.data.expenses.length;

    this.data.expenses = this.data.expenses.filter(
      (expense) =>
        !(
          expense.id === id &&
          expense.user_id === userId
        )
    );

    const deleted =
      this.data.expenses.length < originalLength;

    if (deleted) this.save();

    return deleted;
  }

  // ---------------- INCOMES ----------------

  getIncomes(userId) {
    return this.data.incomes.filter(
      (income) => income.user_id === userId
    );
  }

  getIncomeById(id, userId) {
    return this.data.incomes.find(
      (income) =>
        income.id === id &&
        income.user_id === userId
    );
  }

  createIncome(income) {
    const now = new Date().toISOString();

    const item = {
      id: crypto.randomUUID(),
      ...income,
      created_at: now,
      updated_at: now,
    };

    this.data.incomes.push(item);
    this.save();

    return item;
  }

  updateIncome(id, userId, updates) {
    const item = this.getIncomeById(id, userId);
    if (!item) return null;

    Object.assign(item, updates, {
      updated_at: new Date().toISOString(),
    });

    this.save();
    return item;
  }

  deleteIncome(id, userId) {
    const originalLength = this.data.incomes.length;

    this.data.incomes = this.data.incomes.filter(
      (income) =>
        !(
          income.id === id &&
          income.user_id === userId
        )
    );

    const deleted =
      this.data.incomes.length < originalLength;

    if (deleted) this.save();

    return deleted;
  }

  // ---------------- FINANCIAL TO-DOS ----------------

  getTodos(userId) {
    return this.data.financial_todos.filter(
      (todo) => todo.user_id === userId
    );
  }

  createTodo(todo) {
    const now = new Date().toISOString();

    const item = {
      id: crypto.randomUUID(),
      ...todo,
      created_at: now,
      updated_at: now,
    };

    this.data.financial_todos.push(item);
    this.save();

    return item;
  }

  updateTodo(id, userId, updates) {
    const item = this.data.financial_todos.find(
      (todo) =>
        todo.id === id &&
        todo.user_id === userId
    );

    if (!item) return null;

    Object.assign(item, updates, {
      updated_at: new Date().toISOString(),
    });

    this.save();
    return item;
  }

  toggleTodoComplete(id, userId) {
    const item = this.data.financial_todos.find(
      (todo) =>
        todo.id === id &&
        todo.user_id === userId
    );

    if (!item) return null;

    item.completed = !item.completed;
    item.completed_at = item.completed
      ? new Date().toISOString()
      : null;
    item.updated_at = new Date().toISOString();

    this.save();
    return item;
  }

  deleteTodo(id, userId) {
    const originalLength =
      this.data.financial_todos.length;

    this.data.financial_todos =
      this.data.financial_todos.filter(
        (todo) =>
          !(
            todo.id === id &&
            todo.user_id === userId
          )
      );

    const deleted =
      this.data.financial_todos.length <
      originalLength;

    if (deleted) this.save();

    return deleted;
  }

  // ---------------- MONTHLY BUDGETS ----------------

  getMonthlyBudgets(userId) {
    return this.data.monthly_budgets.filter(
      (item) => item.user_id === userId
    );
  }

  getMonthlyBudget(userId, month) {
    return (
      this.data.monthly_budgets.find(
        (item) =>
          item.user_id === userId &&
          item.month === month
      ) || null
    );
  }

  setMonthlyBudget(userId, month, amount) {
    let item = this.getMonthlyBudget(userId, month);
    const now = new Date().toISOString();

    if (item) {
      item.amount = amount;
      item.updated_at = now;
    } else {
      item = {
        id: crypto.randomUUID(),
        user_id: userId,
        month,
        amount,
        created_at: now,
        updated_at: now,
      };

      this.data.monthly_budgets.push(item);
    }

    this.save();
    return item;
  }

  // ---------------- SAVINGS GOALS ----------------

  getSavingsGoals(userId) {
    return this.data.savings_goals.filter(
      (goal) =>
        goal.user_id === userId &&
        !goal.archived
    );
  }

  createSavingsGoal(goalData) {
    const now = new Date().toISOString();

    const goal = {
      id: crypto.randomUUID(),
      balance: 0,
      archived: false,
      ...goalData,
      created_at: now,
      updated_at: now,
    };

    this.data.savings_goals.push(goal);
    this.save();

    return goal;
  }

  updateSavingsGoal(id, userId, updates) {
    const goal = this.data.savings_goals.find(
      (item) =>
        item.id === id &&
        item.user_id === userId &&
        !item.archived
    );

    if (!goal) return null;

    Object.assign(goal, updates, {
      updated_at: new Date().toISOString(),
    });

    this.save();
    return goal;
  }

  deleteSavingsGoal(id, userId) {
    const goal = this.data.savings_goals.find(
      (item) =>
        item.id === id &&
        item.user_id === userId &&
        !item.archived
    );

    if (!goal) return false;

    // Archive the goal to preserve its transaction history.
    goal.archived = true;
    goal.updated_at = new Date().toISOString();

    this.save();
    return true;
  }

  // ---------------- SAVINGS TRANSACTIONS ----------------

  getSavingsTransactions(userId, goalId = null) {
    return this.data.savings_transactions.filter(
      (item) =>
        item.user_id === userId &&
        (!goalId || item.goal_id === goalId)
    );
  }

  addSavingsTransaction(transaction) {
    const now = new Date().toISOString();

    const item = {
      id: crypto.randomUUID(),
      date: now.slice(0, 10),
      ...transaction,
      created_at: now,
    };

    const goal = this.data.savings_goals.find(
      (entry) =>
        entry.id === item.goal_id &&
        entry.user_id === item.user_id &&
        !entry.archived
    );

    if (!goal) {
      throw new Error('Savings goal not found.');
    }

    const amount = Number(item.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        'Savings transaction amount must be positive.'
      );
    }

    if (
      item.type !== 'contribution' &&
      item.type !== 'withdrawal'
    ) {
      throw new Error(
        'Transaction type must be contribution or withdrawal.'
      );
    }

    if (
      item.type === 'withdrawal' &&
      amount > Number(goal.balance || 0)
    ) {
      throw new Error(
        'Withdrawal exceeds the recorded goal balance.'
      );
    }

    const adjustment =
      item.type === 'contribution'
        ? amount
        : -amount;

    goal.balance = Math.round(
      (Number(goal.balance || 0) + adjustment) * 100
    ) / 100;

    goal.updated_at = now;

    this.data.savings_transactions.push(item);
    this.save();

    return item;
  }

  // ---------------- MYSQL DUMP EXPORTER ----------------

  generateMySQLDump() {
    let sql = '-- MySQL Dump for SpendWise Application\n';
    sql += `-- Generated on ${new Date().toISOString()}\n\n`;
    sql += 'SET FOREIGN_KEY_CHECKS=0;\n\n';

    const escape = (value) =>
      String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    for (const user of this.data.users) {
      sql +=
        'INSERT INTO `users` ' +
        '(`id`, `name`, `username`, `email`, `mobile`, `gender`, `dob`, `password_hash`, `created_at`, `updated_at`) VALUES ' +
        `('${escape(user.id)}', '${escape(user.name)}', '${escape(user.username)}', '${escape(user.email)}', '${escape(user.mobile)}', '${escape(user.gender)}', '${escape(user.dob)}', '${escape(user.password_hash)}', '${escape(user.created_at)}', '${escape(user.updated_at)}') ` +
        'ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);\n';
    }

    sql += '\n-- Financial To-Dos\n';

    for (const todo of this.data.financial_todos) {
      const amount =
        todo.amount === null || todo.amount === undefined
          ? 'NULL'
          : Number(todo.amount);

      const completedAt = todo.completed_at
        ? `'${escape(todo.completed_at)}'`
        : 'NULL';

      sql +=
        'INSERT INTO `financial_todos` ' +
        '(`id`, `user_id`, `title`, `due_date`, `due_time`, `priority`, `category`, `amount`, `completed`, `completed_at`, `note`, `created_at`, `updated_at`) VALUES ' +
        `('${escape(todo.id)}', '${escape(todo.user_id)}', '${escape(todo.title)}', '${escape(todo.due_date)}', '${escape(todo.due_time)}', '${escape(todo.priority)}', '${escape(todo.category)}', ${amount}, ${todo.completed ? 1 : 0}, ${completedAt}, '${escape(todo.note)}', '${escape(todo.created_at)}', '${escape(todo.updated_at)}') ` +
        'ON DUPLICATE KEY UPDATE `completed`=VALUES(`completed`);\n';
    }

    sql += '\nSET FOREIGN_KEY_CHECKS=1;\n';

    return sql;
  }
}

export const db = new Database();
