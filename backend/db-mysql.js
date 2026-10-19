
import mysql from 'mysql2/promise';
import 'dotenv/config';
import crypto from 'crypto';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'spendwise_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const dateOnly = () => new Date().toISOString().slice(0, 10);

async function rows(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

async function one(sql, params = []) {
  const result = await rows(sql, params);
  return result[0] || null;
}

async function insert(table, data) {
  const columns = Object.keys(data);
  const sql = `INSERT INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
  await rows(sql, columns.map(c => data[c]));
  return data;
}

async function update(table, recordId, userId, changes) {
  const allowed = {
    users: ['name', 'username', 'email', 'mobile', 'gender', 'dob', 'password_hash'],
    expenses: ['date', 'time', 'category_id', 'category_name', 'amount', 'note'],
    incomes: ['date', 'time', 'source_id', 'source_name', 'amount', 'note'],
    financial_todos: ['title', 'due_date', 'due_time', 'priority', 'category', 'amount', 'completed', 'completed_at', 'note'],
    savings_goals: ['title', 'target_amount', 'deadline', 'note', 'archived', 'balance'],
  }[table] || [];

  const data = Object.fromEntries(
    Object.entries(changes).filter(([key]) => allowed.includes(key))
  );
  data.updated_at = now();

  const keys = Object.keys(data);
  if (keys.length > 1) {
    await rows(
      `UPDATE \`${table}\` SET ${keys.map(k => `\`${k}\` = ?`).join(', ')} WHERE id = ? AND user_id = ?`,
      [...keys.map(k => data[k]), recordId, userId]
    );
  }

  return one(`SELECT * FROM \`${table}\` WHERE id = ? AND user_id = ?`, [recordId, userId]);
}

export async function testConnection() {
  const result = await one('SELECT DATABASE() AS databaseName');
  console.log('MySQL connected successfully:', result.databaseName);
  return result.databaseName;
}

const db = {
  async getUsers() {
    return rows('SELECT * FROM users');
  },

  async findUserById(userId) {
    return one('SELECT * FROM users WHERE id = ?', [userId]);
  },

  async findUserByEmailOrMobile(identifier) {
    const value = String(identifier || '').trim();
    return one(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR mobile = ? OR LOWER(username) = LOWER(?) LIMIT 1',
      [value, value, value]
    );
  },

  async createUser(data) {
    const user = { id: id(), ...data, created_at: now(), updated_at: now() };
    await insert('users', user);
    return user;
  },

  async updateUser(userId, changes) {
    const data = { ...changes, updated_at: now() };
    const keys = Object.keys(data);
    await rows(
      `UPDATE users SET ${keys.map(k => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
      [...keys.map(k => data[k]), userId]
    );
    return this.findUserById(userId);
  },

  async getExpenseCategories(userId) {
    return rows(
      'SELECT * FROM expense_categories WHERE user_id IS NULL OR user_id = ?',
      [userId]
    );
  },

  async addExpenseCategory(userId, name, icon = 'Tag', color = '#0284c7') {
    const item = {
      id: id(), user_id: userId, name: name.trim(), icon, color,
      is_custom: 1, created_at: now(),
    };
    await insert('expense_categories', item);
    return item;
  },

  async getIncomeSources(userId) {
    return rows(
      'SELECT * FROM income_sources WHERE user_id IS NULL OR user_id = ?',
      [userId]
    );
  },

  async addIncomeSource(userId, name, icon = 'Coins', color = '#0284c7') {
    const item = {
      id: id(), user_id: userId, name: name.trim(), icon, color,
      is_custom: 1, created_at: now(),
    };
    await insert('income_sources', item);
    return item;
  },

  async getExpenses(userId) {
    return rows('SELECT * FROM expenses WHERE user_id = ?', [userId]);
  },

  async getExpenseById(recordId, userId) {
    return one('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [recordId, userId]);
  },

  async createExpense(data) {
    const item = { id: id(), ...data, created_at: now(), updated_at: now() };
    await insert('expenses', item);
    return item;
  },

  async updateExpense(recordId, userId, changes) {
    return update('expenses', recordId, userId, changes);
  },

  async deleteExpense(recordId, userId) {
    const result = await rows('DELETE FROM expenses WHERE id = ? AND user_id = ?', [recordId, userId]);
    return result.affectedRows > 0;
  },

  async getIncomes(userId) {
    return rows('SELECT * FROM incomes WHERE user_id = ?', [userId]);
  },

  async getIncomeById(recordId, userId) {
    return one('SELECT * FROM incomes WHERE id = ? AND user_id = ?', [recordId, userId]);
  },

  async createIncome(data) {
    const item = { id: id(), ...data, created_at: now(), updated_at: now() };
    await insert('incomes', item);
    return item;
  },

  async updateIncome(recordId, userId, changes) {
    return update('incomes', recordId, userId, changes);
  },

  async deleteIncome(recordId, userId) {
    const result = await rows('DELETE FROM incomes WHERE id = ? AND user_id = ?', [recordId, userId]);
    return result.affectedRows > 0;
  },

  async getTodos(userId) {
    return rows('SELECT * FROM financial_todos WHERE user_id = ?', [userId]);
  },

  async createTodo(data) {
    const item = {
      id: id(), completed: 0, ...data,
      created_at: now(), updated_at: now(),
    };
    await insert('financial_todos', item);
    return item;
  },

  async updateTodo(recordId, userId, changes) {
    return update('financial_todos', recordId, userId, changes);
  },

  async toggleTodo(recordId, userId) {
    const todo = await one(
      'SELECT * FROM financial_todos WHERE id = ? AND user_id = ?',
      [recordId, userId]
    );
    if (!todo) return null;

    const completed = !Boolean(todo.completed);
    await rows(
      'UPDATE financial_todos SET completed = ?, completed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [completed ? 1 : 0, completed ? now() : null, now(), recordId, userId]
    );
    return one('SELECT * FROM financial_todos WHERE id = ?', [recordId]);
  },

  async deleteTodo(recordId, userId) {
    const result = await rows(
      'DELETE FROM financial_todos WHERE id = ? AND user_id = ?',
      [recordId, userId]
    );
    return result.affectedRows > 0;
  },

  async getMonthlyBudgets(userId) {
    const data = await rows('SELECT * FROM monthly_budgets WHERE user_id = ?', [userId]);
    return data.map(item => ({
      ...item,
      month: `${item.year}-${String(item.month).padStart(2, '0')}`,
    }));
  },

  async getMonthlyBudget(userId, month) {
    const [year, monthNumber] = month.split('-').map(Number);
    const item = await one(
      'SELECT * FROM monthly_budgets WHERE user_id = ? AND month = ? AND year = ?',
      [userId, monthNumber, year]
    );
    return item ? { ...item, month } : null;
  },

  async setMonthlyBudget(userId, month, amount) {
    const [year, monthNumber] = month.split('-').map(Number);
    const existing = await this.getMonthlyBudget(userId, month);

    if (existing) {
      await rows(
        'UPDATE monthly_budgets SET amount = ?, updated_at = ? WHERE id = ?',
        [amount, now(), existing.id]
      );
      return { ...existing, amount, updated_at: now() };
    }

    const item = {
      id: id(), user_id: userId, month: monthNumber, year,
      amount, created_at: now(), updated_at: now(),
    };
    await insert('monthly_budgets', item);
    return { ...item, month };
  },

  async getSavingsGoals(userId) {
    const goals = await rows(
      'SELECT * FROM savings_goals WHERE user_id = ? AND archived = 0',
      [userId]
    );
    return goals.map(g => ({ ...g, archived: Boolean(g.archived) }));
  },

  async createSavingsGoal(data) {
    const item = {
      id: id(), balance: 0, archived: 0, ...data,
      created_at: now(), updated_at: now(),
    };
    await insert('savings_goals', item);
    return item;
  },

  async updateSavingsGoal(recordId, userId, changes) {
    return update('savings_goals', recordId, userId, changes);
  },

  async deleteSavingsGoal(recordId, userId) {
    const result = await rows(
      'UPDATE savings_goals SET archived = 1, updated_at = ? WHERE id = ? AND user_id = ? AND archived = 0',
      [now(), recordId, userId]
    );
    return result.affectedRows > 0;
  },

  async getSavingsTransactions(userId, goalId = null) {
    if (goalId) {
      return rows(
        'SELECT * FROM savings_transactions WHERE user_id = ? AND goal_id = ?',
        [userId, goalId]
      );
    }
    return rows('SELECT * FROM savings_transactions WHERE user_id = ?', [userId]);
  },

  async addSavingsTransaction(data) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [goals] = await connection.execute(
        'SELECT * FROM savings_goals WHERE id = ? AND user_id = ? AND archived = 0 FOR UPDATE',
        [data.goal_id, data.user_id]
      );
      const goal = goals[0];

      if (!goal) throw new Error('Savings goal not found.');

      const amount = Number(data.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Savings transaction amount must be positive.');
      }
      if (!['contribution', 'withdrawal'].includes(data.type)) {
        throw new Error('Transaction type must be contribution or withdrawal.');
      }
      if (data.type === 'withdrawal' && amount > Number(goal.balance || 0)) {
        throw new Error('Withdrawal exceeds the recorded goal balance.');
      }

      const transaction = {
        id: id(),
        ...data,
        amount,
        date: data.date || dateOnly(),
        created_at: now(),
      };

      const adjustment = data.type === 'contribution' ? amount : -amount;
      const balance = Math.round((Number(goal.balance || 0) + adjustment) * 100) / 100;

      await connection.execute(
        'UPDATE savings_goals SET balance = ?, updated_at = ? WHERE id = ?',
        [balance, now(), goal.id]
      );

      const columns = Object.keys(transaction);
      await connection.execute(
        `INSERT INTO savings_transactions (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
        columns.map(c => transaction[c])
      );

      await connection.commit();
      return transaction;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async generateMySQLDump() {
    const tables = [
      'users', 'expense_categories', 'income_sources', 'expenses', 'incomes',
      'financial_todos', 'monthly_budgets', 'savings_goals', 'savings_transactions',
    ];
    const dump = ['SET FOREIGN_KEY_CHECKS=0;'];

    for (const table of tables) {
      const records = await rows(`SELECT * FROM \`${table}\``);
      for (const record of records) {
        const columns = Object.keys(record);
        const values = columns.map(c => {
          const value = record[c];
          if (value === null || value === undefined) return 'NULL';
          if (typeof value === 'number') return String(value);
          return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        });
        dump.push(
          `INSERT INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${values.join(', ')});`
        );
      }
    }

    dump.push('SET FOREIGN_KEY_CHECKS=1;');
    return dump.join('\n');
  },
};

export { pool };
export default db;
