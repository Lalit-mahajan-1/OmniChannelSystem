const express = require('express');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
} = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All task routes require employer authentication
router.use(authenticate, authorize('employer'));

router.get('/stats', getTaskStats);
router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
