import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import db from '../db-mysql.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'recurring_transactions.json');

function readSchedules() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Could not read recurring transaction data:', error);
    return [];
  }
}

function saveSchedules(schedules) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(schedules, null, 2), 'utf8');
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

function addInterval(dateString, frequency, anchorDay, anchorMonth) {
  const [year, month] = dateString.split('-').map(Number);
  const day = Number(dateString.slice(-2));

  if (frequency === 'weekly') {
    return new Date(
      Date.UTC(year, month - 1, day + 7)
    ).toISOString().slice(0, 10);
  }

  if (frequency === 'yearly') {
    const targetMonth = (anchorMonth || month) - 1;
    const targetYear = year + 1;

    const lastDay = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0)
    ).getUTCDate();

    return new Date(
      Date.UTC(
        targetYear,
        targetMonth,
        Math.min(anchorDay || day, lastDay)
      )
    ).toISOString().slice(0, 10);
  }

  const targetMonth = month;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = targetMonth % 12;

  const lastDay = new Date(
    Date.UTC(targetYear, normalizedMonth + 1, 0)
  ).getUTCDate();

  return new Date(
    Date.UTC(
      targetYear,
      normalizedMonth,
      Math.min(anchorDay || day, lastDay)
    )
  ).toISOString().slice(0, 10);
}

async function processDueSchedules(schedules, userId) {
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;
  let createdCount = 0;

  for (const schedule of schedules) {
    if (
      String(schedule.user_id) !== String(userId) ||
      schedule.status !== 'active'
    ) {
      continue;
    }

    let iterations = 0;

    while (
      schedule.next_run_date <= today &&
      (!schedule.end_date || schedule.next_run_date <= schedule.end_date) &&
      iterations < 500
    ) {
      const runDate = schedule.next_run_date;
      const alreadyCreated = schedule.processed_dates?.includes(runDate);

      if (!alreadyCreated) {
        if (schedule.type === 'expense') {
          await db.createExpense({
            user_id: userId,
            date: runDate,
            time: schedule.time,
            category_id: schedule.category_id,
            category_name: schedule.category_name,
            amount: schedule.amount,
            note: schedule.note
              ? `${schedule.note} (Recurring)`
              : 'Recurring transaction',
            recurring_schedule_id: schedule.id,
          });
        } else {
          await db.createIncome({
            user_id: userId,
            date: runDate,
            time: schedule.time,
            source_id: schedule.source_id,
            source_name: schedule.source_name,
            amount: schedule.amount,
            note: schedule.note
              ? `${schedule.note} (Recurring)`
              : 'Recurring transaction',
            recurring_schedule_id: schedule.id,
          });
        }

        schedule.processed_dates ||= [];
        schedule.processed_dates.push(runDate);
        createdCount += 1;
      }

      schedule.last_run_date = runDate;
      schedule.next_run_date = addInterval(
        runDate,
        schedule.frequency,
        schedule.anchor_day,
        schedule.anchor_month
      );

      if (
        schedule.end_date &&
        schedule.next_run_date > schedule.end_date
      ) {
        schedule.status = 'completed';
      }

      changed = true;
      iterations += 1;
    }
  }

  if (changed) {
    saveSchedules(schedules);
  }

  return createdCount;
}

// GET /api/recurring
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const schedules = readSchedules();
    const createdCount = await processDueSchedules(schedules, userId);

    const userSchedules = schedules
      .filter((schedule) => String(schedule.user_id) === String(userId))
      .sort((a, b) => a.next_run_date.localeCompare(b.next_run_date));

    res.json({
      success: true,
      schedules: userSchedules,
      createdCount,
    });
  } catch (error) {
    console.error('Failed to retrieve recurring schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recurring transactions.',
    });
  }
});

// POST /api/recurring
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      type,
      frequency,
      start_date,
      end_date,
      time,
      amount,
      category_id,
      source_id,
      note,
    } = req.body;

    const numAmount = Number(amount);

    if (!['expense', 'income'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Choose expense or income.',
      });
    }

    if (!['weekly', 'monthly', 'yearly'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Choose a valid recurrence frequency.',
      });
    }

    if (
      !validDate(start_date) ||
      (end_date && !validDate(end_date))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter valid start and end dates.',
      });
    }

    if (end_date && end_date < start_date) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be before start date.',
      });
    }

    if (!time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid transaction time.',
      });
    }

    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero.',
      });
    }

    let category = null;
    let source = null;

    if (type === 'expense') {
      const categories = await db.getExpenseCategories(userId);
      category = categories.find(
        (item) => String(item.id) === String(category_id)
      );

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Choose a valid expense category.',
        });
      }
    } else {
      const sources = await db.getIncomeSources(userId);
      source = sources.find(
        (item) => String(item.id) === String(source_id)
      );

      if (!source) {
        return res.status(400).json({
          success: false,
          message: 'Choose a valid income source.',
        });
      }
    }

    const schedules = readSchedules();

    const schedule = {
      id: crypto.randomUUID(),
      user_id: userId,
      type,
      frequency,
      start_date,
      anchor_day: Number(start_date.slice(-2)),
      anchor_month: Number(start_date.slice(5, 7)),
      next_run_date: start_date,
      end_date: end_date || null,
      time,
      amount: numAmount,
      category_id: category?.id || null,
      category_name: category?.name || null,
      source_id: source?.id || null,
      source_name: source?.name || null,
      note: String(note || '').trim(),
      status: 'active',
      processed_dates: [],
      last_run_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    schedules.push(schedule);
    saveSchedules(schedules);

    await processDueSchedules(schedules, userId);

    res.status(201).json({
      success: true,
      schedule,
      message: 'Recurring transaction created.',
    });
  } catch (error) {
    console.error('Failed to create recurring schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recurring transaction.',
    });
  }
});

// PATCH /api/recurring/:id/status
router.patch('/:id/status', (req, res) => {
  try {
    const schedules = readSchedules();

    const schedule = schedules.find(
      (item) =>
        item.id === req.params.id &&
        String(item.user_id) === String(req.user.id)
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Recurring transaction not found.',
      });
    }

    if (!['active', 'paused'].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be active or paused.',
      });
    }

    schedule.status = req.body.status;
    schedule.updated_at = new Date().toISOString();

    saveSchedules(schedules);

    res.json({
      success: true,
      schedule,
      message: `Recurring transaction ${schedule.status}.`,
    });
  } catch (error) {
    console.error('Failed to update recurring schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recurring transaction.',
    });
  }
});

// DELETE /api/recurring/:id
router.delete('/:id', (req, res) => {
  try {
    const schedules = readSchedules();

    const nextSchedules = schedules.filter(
      (item) =>
        !(
          item.id === req.params.id &&
          String(item.user_id) === String(req.user.id)
        )
    );

    if (nextSchedules.length === schedules.length) {
      return res.status(404).json({
        success: false,
        message: 'Recurring transaction not found.',
      });
    }

    saveSchedules(nextSchedules);

    res.json({
      success: true,
      message: 'Recurring schedule deleted. Existing transactions were kept.',
    });
  } catch (error) {
    console.error('Failed to delete recurring schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recurring transaction.',
    });
  }
});

export default router;