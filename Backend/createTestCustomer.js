// Quick script to create a test customer for ticket intelligence
require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');

const createTestCustomer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const existing = await Customer.findOne({ email: 'customer@test.com' });
    if (existing) {
      console.log('✓ Test customer already exists:');
      console.log('  Name: John Doe');
      console.log('  Email: customer@test.com');
      console.log('  Customer ID:', existing._id.toString());
      console.log('');
      console.log('Use this ID in the Ticket Intelligence form!');
      process.exit(0);
    }

    const customer = await Customer.create({
      name: 'John Doe',
      email: 'customer@test.com',
      password: 'password123',
      phone: '+1234567890',
      role: 'customer',
      isActive: true,
    });

    console.log('✓ Test customer created successfully!');
    console.log('');
    console.log('Customer details:');
    console.log('  Name: John Doe');
    console.log('  Email: customer@test.com');
    console.log('  Customer ID:', customer._id.toString());
    console.log('');
    console.log('Copy the Customer ID above and use it in the AI Ticket Intelligence form!');

    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
};

createTestCustomer();
