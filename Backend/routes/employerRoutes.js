const express = require('express');
const router = express.Router();
const {
  createEmployer,
  getAllEmployers,
  getEmployerById,
  updateEmployer,
  deleteEmployer,
  loginEmployer,
  changePassword,
} = require('../controllers/employerController');

const { authenticate, authorize } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateLogin, validateRegistration, validateObjectId } = require('../middleware/validate');

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post('/login', authLimiter, validateLogin, loginEmployer);
router.post('/register', authLimiter, validateRegistration, createEmployer);

// ── Protected Routes (Employer only) ──────────────────────────────────────────
router.get('/', authenticate, authorize('employer'), getAllEmployers);

router.route('/:id')
  .get(authenticate, authorize('employer'), validateObjectId(), getEmployerById)
  .put(authenticate, authorize('employer'), validateObjectId(), updateEmployer)
  .patch(authenticate, authorize('employer'), validateObjectId(), updateEmployer)
  .delete(authenticate, authorize('employer'), validateObjectId(), deleteEmployer);

// Password change route
router.patch('/:id/password', authenticate, authorize('employer'), validateObjectId(), changePassword);

module.exports = router;