import { Router } from 'express';
import db from '../db-mysql.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
    const userId = req.user.id;
    const { month, year } = req.query;

   const allExpenses = await db.getExpenses(userId);
const allIncomes = await db.getIncomes(userId);
const categories = await db.getExpenseCategories(userId);
const sources = await db.getIncomeSources(userId);

    // Filter by selected period if provided, otherwise all or current year
    const targetYear = year ? parseInt(String(year)) : new Date().getFullYear();
    const targetMonth = month ? String(month).padStart(2, '0') : null;

    const filterPeriod = (dateStr) => {
      if (targetMonth) {
        return dateStr.startsWith(`${targetYear}-${targetMonth}`);
      }
      return dateStr.startsWith(`${targetYear}`);
    };

    const periodExpenses = allExpenses.filter((e) => filterPeriod(e.date));
    const periodIncomes = allIncomes.filter((i) => filterPeriod(i.date));

    // Summary calculations
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncomes = periodIncomes.reduce((sum, i) => sum + i.amount, 0);
    const netBalance = totalIncomes - totalExpenses;
    const savingsRate = totalIncomes > 0 ? Math.max(0, Math.round((netBalance / totalIncomes) * 100)) : 0;

    // Category breakdown
    const categoryMap = {};
    for (const exp of periodExpenses) {
      if (!categoryMap[exp.category_id]) {
        const catObj = categories.find((c) => c.id === exp.category_id);
        categoryMap[exp.category_id] = {
          name: exp.category_name,
          amount: 0,
          color: catObj?.color || '#0284c7',
          count: 0,
        };
      }
      categoryMap[exp.category_id].amount += exp.amount;
      categoryMap[exp.category_id].count += 1;
    }

    const expenseByCategory = Object.values(categoryMap)
      .map((item) => ({
        ...item,
        percentage: totalExpenses > 0 ? Math.round((item.amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Source breakdown
    const sourceMap = {};
    for (const inc of periodIncomes) {
      if (!sourceMap[inc.source_id]) {
        const srcObj = sources.find((s) => s.id === inc.source_id);
        sourceMap[inc.source_id] = {
          name: inc.source_name,
          amount: 0,
          color: srcObj?.color || '#0ea5e9',
          count: 0,
        };
      }
      sourceMap[inc.source_id].amount += inc.amount;
      sourceMap[inc.source_id].count += 1;
    }

    const incomeBySource = Object.values(sourceMap)
      .map((item) => ({
        ...item,
        percentage: totalIncomes > 0 ? Math.round((item.amount / totalIncomes) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Monthly trends (past 6 months)
    const monthlyTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${y}-${m}`;
      const monthLabel = d.toLocaleString('default', { month: 'short' });

      const mInc = allIncomes.filter((item) => item.date.startsWith(prefix)).reduce((sum, item) => sum + item.amount, 0);
      const mExp = allExpenses.filter((item) => item.date.startsWith(prefix)).reduce((sum, item) => sum + item.amount, 0);

      monthlyTrend.push({
        month: `${monthLabel} ${y !== now.getFullYear() ? y : ''}`.trim(),
        income: mInc,
        expense: mExp,
        net: mInc - mExp,
      });
    }

    // Recent combined transactions
    const combinedRecent = [
      ...allExpenses.slice(0, 15).map((e) => ({
        id: e.id,
        type: 'expense',
        title: e.category_name,
        date: e.date,
        time: e.time,
        amount: e.amount,
        note: e.note,
        category_id: e.category_id,
      })),
      ...allIncomes.slice(0, 15).map((i) => ({
        id: i.id,
        type: 'income',
        title: i.source_name,
        date: i.date,
        time: i.time,
        amount: i.amount,
        note: i.note,
        source_id: i.source_id,
      })),
    ]
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
      .slice(0, 8);

    res.json({
      success: true,
      data: {
        summary: {
          totalIncome: totalIncomes,
          totalExpense: totalExpenses,
          netBalance,
          savingsRate,
          expenseCount: periodExpenses.length,
          incomeCount: periodIncomes.length,
        },
        expenseByCategory,
        incomeBySource,
        monthlyTrend,
        recentTransactions: combinedRecent,
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute dashboard analytics.' });
  }
});

export default router;
