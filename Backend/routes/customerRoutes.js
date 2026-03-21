const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByChannel,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');

// POST   /api/customers                          — create customer
// GET    /api/customers                          — get all customers
router.route('/').post(createCustomer).get(getAllCustomers);

// GET    /api/customers/channel/:channel/:value  — resolve by channel id
// Must be above /:id so Express doesn't treat "channel" as an id
router.get('/channel/:channel/:value', getCustomerByChannel);

// GET    /api/customers/:id                      — get single customer
// PUT    /api/customers/:id                      — update customer
// DELETE /api/customers/:id                      — soft delete customer
router.route('/:id').get(getCustomerById).put(updateCustomer).delete(deleteCustomer);

module.exports = router;