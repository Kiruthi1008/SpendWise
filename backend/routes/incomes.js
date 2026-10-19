import { Router } from 'express';
import db from '../db-mysql.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/incomes/sources
router.get('/sources', async (req, res) => {
  try {
    const sources = await db.getIncomeSources(req.user.id);
    res.json({ success: true, sources });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve income sources.',
    });
  }
});

// POST /api/incomes/sources
router.post('/sources', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, icon, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Income source name is required.',
      });
    }

    const sources = await db.getIncomeSources(userId);
    const existing = sources.find(
      (s) => s.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An income source with this name already exists.',
      });
    }

    const newSource = await db.addIncomeSource(
      userId,
      name.trim(),
      icon || 'Coins',
      color || '#0284c7'
    );

    res.status(201).json({
      success: true,
      source: newSource,
      message: 'Custom income type added!',
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to create income source.',
    });
  }
});

// GET /api/incomes
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    let incomes = await db.getIncomes(userId);

    const { source, search, startDate, endDate, month, year } = req.query;

    if (source && typeof source === 'string' && source !== 'all') {
      incomes = incomes.filter(
        (i) =>
          String(i.source_id) === source ||
          (i.source_name || '').toLowerCase() === source.toLowerCase()
      );
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();

      incomes = incomes.filter(
        (i) =>
          (i.source_name || '').toLowerCase().includes(q) ||
          (i.note && i.note.toLowerCase().includes(q)) ||
          String(i.amount).includes(q)
      );
    }

    if (month && year) {
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      incomes = incomes.filter((i) =>
        String(i.date).startsWith(monthPrefix)
      );
    } else if (startDate && endDate) {
      incomes = incomes.filter(
        (i) =>
          String(i.date) >= String(startDate) &&
          String(i.date) <= String(endDate)
      );
    }

    incomes.sort((a, b) => {
      const dateA = `${a.date} ${a.time || ''}`;
      const dateB = `${b.date} ${b.time || ''}`;
      return dateB.localeCompare(dateA);
    });

    res.json({ success: true, incomes });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve incomes.',
    });
  }
});

// POST /api/incomes
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      date,
      time,
      source_id,
      source_name,
      custom_source_name,
      amount,
      note,
    } = req.body;

    if (!date || !time || (!source_id && !custom_source_name)) {
      return res.status(400).json({
        success: false,
        message: 'Date, time, and income source are required.',
      });
    }

    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid amount greater than 0.',
      });
    }

    let finalSourceId = source_id;
    let finalSourceName = source_name;

    const sources = await db.getIncomeSources(userId);

    if (!finalSourceId && custom_source_name) {
      const existing = sources.find(
        (s) =>
          s.name.toLowerCase() === custom_source_name.trim().toLowerCase()
      );

      if (existing) {
        finalSourceId = existing.id;
        finalSourceName = existing.name;
      } else {
        const createdSrc = await db.addIncomeSource(
          userId,
          custom_source_name.trim()
        );

        finalSourceId = createdSrc.id;
        finalSourceName = createdSrc.name;
      }
    } else if (finalSourceId && !finalSourceName) {
      const src = sources.find(
        (s) => String(s.id) === String(finalSourceId)
      );

      finalSourceName = src ? src.name : 'Other Income';
    }

    const newIncome = await db.createIncome({
      user_id: userId,
      date,
      time,
      source_id: finalSourceId,
      source_name: finalSourceName,
      amount: numAmount,
      note: (note || '').trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Income added successfully!',
      income: newIncome,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to record income.',
    });
  }
});

// PUT /api/incomes/:id
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { date, time, source_id, source_name, amount, note } = req.body;

    const existing = await db.getIncomeById(id, userId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found.',
      });
    }

    const updates = {};

    if (date) updates.date = date;
    if (time) updates.time = time;

    if (source_id) {
      updates.source_id = source_id;

      const sources = await db.getIncomeSources(userId);
      const src = sources.find(
        (s) => String(s.id) === String(source_id)
      );

      updates.source_name = src
        ? src.name
        : source_name || existing.source_name;
    } else if (source_name) {
      updates.source_name = source_name;
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

    const updated = await db.updateIncome(id, userId, updates);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found.',
      });
    }

    res.json({
      success: true,
      message: 'Income updated successfully!',
      income: updated,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to update income.',
    });
  }
});

// DELETE /api/incomes/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const deleted = await db.deleteIncome(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found.',
      });
    }

    res.json({
      success: true,
      message: 'Income deleted successfully.',
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to delete income.',
    });
  }
});

export default router;