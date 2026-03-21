const express = require('express');
const router = express.Router();
const {
  createEmployer,
  getAllEmployers,
  getEmployerById,
  updateEmployer,
  deleteEmployer,
  loginEmployer,
} = require('../controllers/employerController');

// Public routes
router.post('/login', loginEmployer);

// CRUD routes
router.route('/').post(createEmployer).get(getAllEmployers);
router.route('/:id').get(getEmployerById).put(updateEmployer).delete(deleteEmployer);

module.exports = router;