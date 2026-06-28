const Task = require('../models/Task');
const mongoose = require('mongoose');

// GET /api/tasks - Get all tasks for current user
const getTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.query;
    const userId = req.userId;

    const filter = {};

    // Default: show tasks assigned to me or created by me
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    } else {
      filter.$or = [{ assignedTo: userId }, { createdBy: userId }];
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('customerId', 'name email phone healthScore healthStatus')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    console.error('[Tasks] getTasks error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tasks - Create new task
const createTask = async (req, res) => {
  try {
    const { title, description, ticketId, customerId, assignedTo, priority, dueDate, channel, sentiment, category, notes } = req.body;
    const userId = req.userId;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim(),
      ticketId,
      customerId: customerId && mongoose.Types.ObjectId.isValid(customerId) ? customerId : null,
      assignedTo: assignedTo || userId,
      createdBy: userId,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      channel,
      sentiment,
      category,
      notes: notes?.trim(),
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('customerId', 'name email phone healthScore healthStatus')
      .lean();

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('[Tasks] createTask error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/tasks/:id - Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, status, priority, dueDate, notes, completedAt } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (description !== undefined) update.description = description?.trim();
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (priority !== undefined) update.priority = priority;
    if (dueDate !== undefined) update.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) update.notes = notes?.trim();

    if (status !== undefined) {
      update.status = status;
      if (status === 'done' && !completedAt) {
        update.completedAt = new Date();
      } else if (status !== 'done') {
        update.completedAt = null;
      }
    }

    const task = await Task.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('customerId', 'name email phone healthScore healthStatus')
      .lean();

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.json({ success: true, data: task });
  } catch (err) {
    console.error('[Tasks] updateTask error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/tasks/:id - Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    console.error('[Tasks] deleteTask error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tasks/stats - Get task statistics
const getTaskStats = async (req, res) => {
  try {
    const userId = req.userId;

    const [myTasks, todoCount, inProgressCount, doneCount, overdueCount] = await Promise.all([
      Task.countDocuments({ assignedTo: userId }),
      Task.countDocuments({ assignedTo: userId, status: 'todo' }),
      Task.countDocuments({ assignedTo: userId, status: 'in_progress' }),
      Task.countDocuments({ assignedTo: userId, status: 'done' }),
      Task.countDocuments({
        assignedTo: userId,
        status: { $ne: 'done' },
        dueDate: { $lt: new Date() },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        total: myTasks,
        todo: todoCount,
        inProgress: inProgressCount,
        done: doneCount,
        overdue: overdueCount,
      },
    });
  } catch (err) {
    console.error('[Tasks] getTaskStats error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const autoCreateTask = async ({ title, description, customerId, priority, channel, category, createdBy }) => {
  try {
    const existing = await Task.findOne({ title, status: { $ne: 'done' } });
    if (existing) return existing;

    return await Task.create({
      title,
      description,
      customerId: customerId && mongoose.Types.ObjectId.isValid(customerId) ? customerId : null,
      assignedTo: createdBy,
      createdBy,
      priority: priority || 'medium',
      channel,
      category,
    });
  } catch (err) {
    console.error('[Tasks] autoCreate error:', err.message);
    return null;
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  autoCreateTask,
};
