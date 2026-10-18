
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'bills.json');

const FREQUENCIES = [
  'one-time',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
];

function readBills() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  if (!Array.isArray(data)) {
    throw new Error('Bills data must be a JSON array.');
  }

  return data;
}

function saveBills(bills) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(bills, null, 2), 'utf8');
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function addFrequency(dateString, frequency) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (frequency === 'weekly') {
    date.setUTCDate(date.getUTCDate() + 7);
  } else if (frequency === 'monthly') {
    const targetMonth = date.getUTCMonth() + 1;
    const targetYear = date.getUTCFullYear();
    const lastDay = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0)
    ).getUTCDate();

    date.setUTCDate(1);
    date.setUTCMonth(targetMonth);
    date.setUTCDate(Math.min(day, lastDay));
  } else if (frequency === 'quarterly') {
    const targetMonth = date.getUTCMonth() + 3;
    const targetYear = date.getUTCFullYear();
    const lastDay = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0)
    ).getUTCDate();

    date.setUTCDate(1);
    date.setUTCMonth(targetMonth);
    date.setUTCDate(Math.min(day, lastDay));
  } else if (frequency === 'yearly') {
    const targetYear = date.getUTCFullYear() + 1;
    const targetMonth = date.getUTCMonth();
    const lastDay = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0)
    ).getUTCDate();

    date.setUTCDate(1);
    date.setUTCFullYear(targetYear);
    date.setUTCDate(Math.min(day, lastDay));
  }

  return date.toISOString().slice(0, 10);
}

function refreshBillStatus(bill) {
  if (bill.status === 'paid' || bill.status === 'cancelled') {
    return bill;
  }

  bill.status =
    bill.due_date < getToday() ? 'overdue' : 'upcoming';

  return bill;
}

function getUserBills(userId) {
  return readBills()
    .filter((bill) => bill.user_id === userId)
    .map(refreshBillStatus)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

// GET /api/bills
router.get('/', (req, res) => {
  try {
    const bills = getUserBills(req.user.id);

    res.json({
      success: true,
      bills,
      summary: {
        total: bills.length,
        upcoming: bills.filter((bill) => bill.status === 'upcoming').length,
        overdue: bills.filter((bill) => bill.status === 'overdue').length,
        paid: bills.filter((bill) => bill.status === 'paid').length,
        unpaidAmount: bills
          .filter((bill) => ['upcoming', 'overdue'].includes(bill.status))
          .reduce((sum, bill) => sum + Number(bill.amount), 0),
      },
    });
  } catch (error) {
    console.error('Failed to retrieve bills:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve bills.',
    });
  }
});

// POST /api/bills
router.post('/', (req, res) => {
  try {
    const {
      name,
      amount,
      category,
      due_date,
      frequency,
      notes,
    } = req.body;

    const numericAmount = Number(amount);

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Enter a bill name.',
      });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero.',
      });
    }

    if (!validDate(due_date)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid due date.',
      });
    }

    if (!FREQUENCIES.includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Choose a valid billing frequency.',
      });
    }

    const bills = readBills();
    const bill = {
      id: crypto.randomUUID(),
      user_id: req.user.id,
      name: name.trim(),
      amount: numericAmount,
      category:
        typeof category === 'string' ? category.trim() : 'Other',
      due_date,
      frequency,
      notes: typeof notes === 'string' ? notes.trim() : '',
      status: 'upcoming',
      payments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    refreshBillStatus(bill);
    bills.push(bill);
    saveBills(bills);

    res.status(201).json({
      success: true,
      bill,
      message: 'Bill created successfully.',
    });
  } catch (error) {
    console.error('Failed to create bill:', error);
    res.status(500).json({
      success: false,
      message: 'Could not create bill.',
    });
  }
});

// PUT /api/bills/:id
router.put('/:id', (req, res) => {
  try {
    const bills = readBills();
    const bill = bills.find(
      (item) =>
        item.id === req.params.id &&
        item.user_id === req.user.id
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.',
      });
    }

    if (bill.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'A paid bill cannot be edited. Create the next occurrence instead.',
      });
    }

    const {
      name,
      amount,
      category,
      due_date,
      frequency,
      notes,
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Bill name cannot be empty.',
        });
      }
      bill.name = name.trim();
    }

    if (amount !== undefined) {
      const numericAmount = Number(amount);

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than zero.',
        });
      }

      bill.amount = numericAmount;
    }

    if (due_date !== undefined) {
      if (!validDate(due_date)) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid due date.',
        });
      }

      bill.due_date = due_date;
    }

    if (frequency !== undefined) {
      if (!FREQUENCIES.includes(frequency)) {
        return res.status(400).json({
          success: false,
          message: 'Choose a valid billing frequency.',
        });
      }

      bill.frequency = frequency;
    }

    if (category !== undefined) {
      bill.category = String(category).trim() || 'Other';
    }

    if (notes !== undefined) {
      bill.notes = String(notes).trim();
    }

    bill.updated_at = new Date().toISOString();
    refreshBillStatus(bill);
    saveBills(bills);

    res.json({
      success: true,
      bill,
      message: 'Bill updated successfully.',
    });
  } catch (error) {
    console.error('Failed to update bill:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update bill.',
    });
  }
});

// POST /api/bills/:id/pay
router.post('/:id/pay', (req, res) => {
  try {
    const bills = readBills();
    const bill = bills.find(
      (item) =>
        item.id === req.params.id &&
        item.user_id === req.user.id
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.',
      });
    }

    if (bill.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This bill is already marked as paid.',
      });
    }

    if (bill.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'A cancelled bill cannot be paid.',
      });
    }

    const paidDate = req.body.paid_date || getToday();

    if (!validDate(paidDate)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid payment date.',
      });
    }

    const payment = {
      id: crypto.randomUUID(),
      amount: Number(bill.amount),
      paid_date: paidDate,
      recorded_at: new Date().toISOString(),
    };

    bill.payments ||= [];
    bill.payments.push(payment);
    bill.last_paid_date = paidDate;

    if (bill.frequency === 'one-time') {
      bill.status = 'paid';
    } else {
      bill.due_date = addFrequency(bill.due_date, bill.frequency);
      bill.status = 'upcoming';
      refreshBillStatus(bill);
    }

    bill.updated_at = new Date().toISOString();
    saveBills(bills);

    res.json({
      success: true,
      bill,
      payment,
      message:
        bill.frequency === 'one-time'
          ? 'Bill marked as paid.'
          : 'Payment recorded and next due date scheduled.',
    });
  } catch (error) {
    console.error('Failed to record bill payment:', error);
    res.status(500).json({
      success: false,
      message: 'Could not record bill payment.',
    });
  }
});

// PATCH /api/bills/:id/cancel
router.patch('/:id/cancel', (req, res) => {
  try {
    const bills = readBills();
    const bill = bills.find(
      (item) =>
        item.id === req.params.id &&
        item.user_id === req.user.id
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.',
      });
    }

    bill.status = 'cancelled';
    bill.updated_at = new Date().toISOString();
    saveBills(bills);

    res.json({
      success: true,
      bill,
      message: 'Bill cancelled.',
    });
  } catch (error) {
    console.error('Failed to cancel bill:', error);
    res.status(500).json({
      success: false,
      message: 'Could not cancel bill.',
    });
  }
});

// DELETE /api/bills/:id
router.delete('/:id', (req, res) => {
  try {
    const bills = readBills();
    const remaining = bills.filter(
      (item) =>
        !(
          item.id === req.params.id &&
          item.user_id === req.user.id
        )
    );

    if (remaining.length === bills.length) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.',
      });
    }

    saveBills(remaining);

    res.json({
      success: true,
      message: 'Bill deleted.',
    });
  } catch (error) {
    console.error('Failed to delete bill:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete bill.',
    });
  }
});

export default router;
