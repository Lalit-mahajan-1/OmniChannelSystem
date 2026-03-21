const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByChannel,
  updateCustomer,
  deleteCustomer,
  loginCustomer,
} = require('../controllers/customercontroller');

// Public routes
router.post('/login', loginCustomer);

// CRUD routes
router.route('/').post(createCustomer).get(getAllCustomers);
router.get('/channel/:channel/:value', getCustomerByChannel);
router.route('/:id').get(getCustomerById).put(updateCustomer).delete(deleteCustomer);

module.exports = router;