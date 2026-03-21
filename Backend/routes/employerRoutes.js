const express = require('express');
const router = express.Router();
const {
  createEmployer,
  getAllEmployers,
  getEmployerById,
  updateEmployer,
  deleteEmployer,
} = require('../controllers/employerController');

// POST   /api/employers        — create employer
// GET    /api/employers        — get all employers
router.route('/').post(createEmployer).get(getAllEmployers);

// GET    /api/employers/:id    — get single employer
// PUT    /api/employers/:id    — update employer
// DELETE /api/employers/:id    — soft delete employer
router.route('/:id').get(getEmployerById).put(updateEmployer).delete(deleteEmployer);

module.exports = router;