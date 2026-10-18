import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/todos
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const todos = db.getTodos(userId);

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    // Calculate urgency counts for notifications
    let overdueCount = 0;
    let dueTodayCount = 0;
    let dueSoonCount = 0;
    let urgentPriorityCount = 0;

    todos.forEach((t) => {
      if (!t.completed) {
        if (t.due_date < todayStr) overdueCount++;
        else if (t.due_date === todayStr) dueTodayCount++;
        else if (t.due_date <= in3DaysStr) dueSoonCount++;

        if (t.priority === 'Urgent') urgentPriorityCount++;
      }
    });

    // Priority sorting order weight
    const priorityWeight = {
      Urgent: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    // Default sorting: Incomplete first, then by earliest due date, then by highest priority
    todos.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.due_date !== b.due_date) {
        return a.due_date.localeCompare(b.due_date);
      }
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });

    res.json({
      success: true,
      todos,
      notificationSummary: {
        overdueCount,
        dueTodayCount,
        dueSoonCount,
        urgentPriorityCount,
        totalPending: overdueCount + dueTodayCount + dueSoonCount,
      },
    });
  } catch (err) {
    console.error('Get todos error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve to-do items.' });
  }
});

// POST /api/todos
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { title, due_date, due_time, priority, category, amount, note } = req.body;

    if (!title || !title.trim() || !due_date) {
      return res.status(400).json({ success: false, message: 'Task title and deadline due date are required.' });
    }

    const numAmount = amount ? parseFloat(amount) : null;

    const newTodo = db.createTodo({
      user_id: userId,
      title: title.trim(),
      due_date,
      due_time: due_time || '23:59',
      priority: priority || 'Medium',
      category: category || 'Bill Payment',
      amount: numAmount && !isNaN(numAmount) ? numAmount : null,
      completed: false,
      note: (note || '').trim(),
    });

    res.status(201).json({
      success: true,
      todo: newTodo,
      message: 'Financial task added with deadline notification tracking!',
    });
  } catch (err) {
    console.error('Create todo error:', err);
    res.status(500).json({ success: false, message: 'Failed to create to-do.' });
  }
});

// PUT /api/todos/:id
router.put('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, due_date, due_time, priority, category, amount, note, completed } = req.body;

    const numAmount = amount ? parseFloat(amount) : null;
    const updates = {};
    if (title) updates.title = title.trim();
    if (due_date) updates.due_date = due_date;
    if (due_time) updates.due_time = due_time;
    if (priority) updates.priority = priority;
    if (category) updates.category = category;
    if (amount !== undefined) updates.amount = numAmount && !isNaN(numAmount) ? numAmount : null;
    if (note !== undefined) updates.note = note.trim();
    if (completed !== undefined) {
      updates.completed = completed;
      updates.completed_at = completed ? new Date().toISOString() : null;
    }

    const updated = db.updateTodo(id, userId, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({
      success: true,
      todo: updated,
      message: 'Task updated successfully!',
    });
  } catch (err) {
    console.error('Update todo error:', err);
    res.status(500).json({ success: false, message: 'Failed to update to-do.' });
  }
});

// PATCH /api/todos/:id/toggle
router.patch('/:id/toggle', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const toggled = db.toggleTodoComplete(id, userId);
    if (!toggled) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({
      success: true,
      todo: toggled,
      message: toggled.completed ? 'Task marked complete!' : 'Task reopened.',
    });
  } catch (err) {
    console.error('Toggle todo error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle task.' });
  }
});

// DELETE /api/todos/:id
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = db.deleteTodo(id, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Task not found or already deleted.' });
    }

    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Delete todo error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete to-do.' });
  }
});

export default router;
