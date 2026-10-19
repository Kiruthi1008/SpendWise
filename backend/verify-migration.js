
import pool from './db-mysql.js';

const tables = [
  'users',
  'expense_categories',
  'income_sources',
  'expenses',
  'incomes',
  'financial_todos',
  'monthly_budgets',
  'savings_goals',
  'savings_transactions',
];

try {
  for (const table of tables) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM \`${table}\``
    );

    console.log(`${table}: ${rows[0].total}`);
  }
} catch (error) {
  console.error('Verification failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
