import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/expenses/categories
router.get('/categories', (req, res) => {
  const userId = req.user.id;
  const categories = db.getExpenseCategories(userId);
  res.json({ success: true, categories });
});

// POST /api/expenses/categories (Add custom expense type)
router.post('/categories', (req, res) => {
  try {
    const userId = req.user.id;
    const { name, icon, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existing = db.getExpenseCategories(userId).find(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
    }

    const newCategory = db.addExpenseCategory(userId, name.trim(), icon || 'Tag', color || '#0284c7');
    res.status(201).json({ success: true, category: newCategory, message: 'Custom expense type added!' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
});

// GET /api/expenses
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    let expenses = db.getExpenses(userId);

    const { category, search, startDate, endDate, month, year } = req.query;

    if (category && typeof category === 'string' && category !== 'all') {
      expenses = expenses.filter((e) => e.category_id === category || e.category_name.toLowerCase() === category.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      expenses = expenses.filter(
        (e) =>
          e.category_name.toLowerCase().includes(q) ||
          (e.note && e.note.toLowerCase().includes(q)) ||
          e.amount.toString().includes(q)
      );
    }

    if (month && year) {
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      expenses = expenses.filter((e) => e.date.startsWith(monthPrefix));
    } else if (startDate && endDate) {
      expenses = expenses.filter((e) => e.date >= String(startDate) && e.date <= String(endDate));
    }

    expenses.sort((a, b) => {
      const dateA = `${a.date} ${a.time}`;
      const dateB = `${b.date} ${b.time}`;
      return dateB.localeCompare(dateA);
    });

    res.json({ success: true, expenses });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to retrieve expenses.' });
  }
});

// POST /api/expenses
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { date, time, category_id, category_name, custom_type_name, amount, note } = req.body;

    if (!date || !time || (!category_id && !custom_type_name)) {
      return res.status(400).json({ success: false, message: 'Date, time, and expense type are required.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid amount greater than 0.' });
    }

    let finalCatId = category_id;
    let finalCatName = category_name;

    if (!finalCatId && custom_type_name) {
      const existing = db.getExpenseCategories(userId).find(
        (c) => c.name.toLowerCase() === custom_type_name.trim().toLowerCase()
      );
      if (existing) {
        finalCatId = existing.id;
        finalCatName = existing.name;
      } else {
        const createdCat = db.addExpenseCategory(userId, custom_type_name.trim());
        finalCatId = createdCat.id;
        finalCatName = createdCat.name;
      }
    } else if (finalCatId && !finalCatName) {
      const cat = db.getExpenseCategories(userId).find((c) => c.id === finalCatId);
      finalCatName = cat ? cat.name : 'Uncategorized';
    }

    const newExpense = db.createExpense({
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
    res.status(500).json({ success: false, message: 'Failed to record expense.' });
  }
});

// PUT /api/expenses/:id
router.put('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { date, time, category_id, category_name, amount, note } = req.body;

    const existing = db.getExpenseById(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Expense record not found.' });
    }

    const updates = {};
    if (date) updates.date = date;
    if (time) updates.time = time;
    if (category_id) {
      updates.category_id = category_id;
      const cat = db.getExpenseCategories(userId).find((c) => c.id === category_id);
      updates.category_name = cat ? cat.name : category_name || existing.category_name;
    } else if (category_name) {
      updates.category_name = category_name;
    }
    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Please enter a valid amount greater than 0.' });
      }
      updates.amount = numAmount;
    }
    if (note !== undefined) {
      updates.note = note.trim();
    }

    const updated = db.updateExpense(id, userId, updates);
    res.json({
      success: true,
      message: 'Expense updated successfully!',
      expense: updated,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update expense.' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = db.deleteExpense(id, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Expense record not found.' });
    }

    res.json({ success: true, message: 'Expense deleted successfully.' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete expense.' });
  }
});

export default router;
