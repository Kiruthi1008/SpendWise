import { Router } from 'express';
import db from '../db-mysql.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/expenses/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.getExpenseCategories(req.user.id);
    res.json({ success: true, categories });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories.',
    });
  }
});

// POST /api/expenses/categories
router.post('/categories', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, icon, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }

    const categories = await db.getExpenseCategories(userId);
    const existing = categories.find(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists.',
      });
    }

    const newCategory = await db.addExpenseCategory(
      userId,
      name.trim(),
      icon || 'Tag',
      color || '#0284c7'
    );

    res.status(201).json({
      success: true,
      category: newCategory,
      message: 'Custom expense type added!',
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to create category.',
    });
  }
});

// GET /api/expenses
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    let expenses = await db.getExpenses(userId);

    const { category, search, startDate, endDate, month, year } = req.query;

    if (category && typeof category === 'string' && category !== 'all') {
      expenses = expenses.filter(
        (e) =>
          String(e.category_id) === category ||
          (e.category_name || '').toLowerCase() === category.toLowerCase()
      );
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();

      expenses = expenses.filter(
        (e) =>
          (e.category_name || '').toLowerCase().includes(q) ||
          (e.note && e.note.toLowerCase().includes(q)) ||
          String(e.amount).includes(q)
      );
    }

    if (month && year) {
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      expenses = expenses.filter((e) =>
        String(e.date).startsWith(monthPrefix)
      );
    } else if (startDate && endDate) {
      expenses = expenses.filter(
        (e) =>
          String(e.date) >= String(startDate) &&
          String(e.date) <= String(endDate)
      );
    }

    expenses.sort((a, b) => {
      const dateA = `${a.date} ${a.time || ''}`;
      const dateB = `${b.date} ${b.time || ''}`;
      return dateB.localeCompare(dateA);
    });

    res.json({ success: true, expenses });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expenses.',
    });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      date,
      time,
      category_id,
      category_name,
      custom_type_name,
      amount,
      note,
    } = req.body;

    if (!date || !time || (!category_id && !custom_type_name)) {
      return res.status(400).json({
        success: false,
        message: 'Date, time, and expense type are required.',
      });
    }

    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid amount greater than 0.',
      });
    }

    let finalCatId = category_id;
    let finalCatName = category_name;

    const categories = await db.getExpenseCategories(userId);

    if (!finalCatId && custom_type_name) {
      const existing = categories.find(
        (c) =>
          c.name.toLowerCase() === custom_type_name.trim().toLowerCase()
      );

      if (existing) {
        finalCatId = existing.id;
        finalCatName = existing.name;
      } else {
        const createdCat = await db.addExpenseCategory(
          userId,
          custom_type_name.trim()
        );

        finalCatId = createdCat.id;
        finalCatName = createdCat.name;
      }
    } else if (finalCatId && !finalCatName) {
      const cat = categories.find(
        (c) => String(c.id) === String(finalCatId)
      );

      finalCatName = cat ? cat.name : 'Uncategorized';
    }

    const newExpense = await db.createExpense({
      user_id: userId,
      date,
      time,
      category_id: finalCatId,
      category_name: finalCatName,
      amount: numAmount,
      note: (note || '').trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Expense added successfully!',
      expense: newExpense,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to record expense.',
    });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { date, time, category_id, category_name, amount, note } = req.body;

    const existing = await db.getExpenseById(id, userId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found.',
      });
    }

    const updates = {};

    if (date) updates.date = date;
    if (time) updates.time = time;

    if (category_id) {
      updates.category_id = category_id;

      const categories = await db.getExpenseCategories(userId);
      const cat = categories.find(
        (c) => String(c.id) === String(category_id)
      );

      updates.category_name = cat
        ? cat.name
        : category_name || existing.category_name;
    } else if (category_name) {
      updates.category_name = category_name;
    }

    if (amount !== undefined) {
      const numAmount = parseFloat(amount);

      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid amount greater than 0.',
        });
      }

      updates.amount = numAmount;
    }

    if (note !== undefined) {
      updates.note = (note || '').trim();
    }

    const updated = await db.updateExpense(id, userId, updates);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found.',
      });
    }

    res.json({
      success: true,
      message: 'Expense updated successfully!',
      expense: updated,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to update expense.',
    });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const deleted = await db.deleteExpense(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found.',
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully.',
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense.',
    });
  }
});

export default router;