const Customer = require('../models/Customer');

const checkDNC = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Customer not found");
  return customer.consentStatus?.dnc || false;
};

const verifyConsent = async (customerId, type) => {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Customer not found");
  
  if (customer.consentStatus?.dnc) return false;
  
  if (type === 'marketing') return customer.consentStatus?.marketing || false;
  if (type === 'transactional') return customer.consentStatus?.transactional || false;
  
  return false;
};

module.exports = {
  checkDNC,
  verifyConsent,
};
