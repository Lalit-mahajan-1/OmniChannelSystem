// Quick script to create a test employer account
require('dotenv').config();
const mongoose = require('mongoose');
const Employer = require('./models/Employer');

const createTestEmployer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Check if test employer already exists
    const existing = await Employer.findOne({ email: 'admin@test.com' });
    if (existing) {
      console.log('✓ Test employer already exists:');
      console.log('  Email: admin@test.com');
      console.log('  Password: password123');
      process.exit(0);
    }

    // Create new test employer
    const employer = await Employer.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      company: 'Test Company',
      role: 'employer',
      isActive: true,
    });

    console.log('✓ Test employer created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('  Email: admin@test.com');
    console.log('  Password: password123');
    console.log('');
    console.log('Use these credentials at http://localhost:8081/login');

    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
};

createTestEmployer();
