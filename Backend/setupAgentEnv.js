require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Employer = require('./models/Employer');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const employer = await Employer.findOne({ isActive: true }).sort({ createdAt: 1 });

    if (!employer) {
      console.error('No active employer found. Run: node createTestUser.js first.');
      process.exit(1);
    }

    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    envContent = envContent.replace(
      /^EMPLOYER_MONGO_ID=.*$/m,
      `EMPLOYER_MONGO_ID=${employer._id.toString()}`
    );

    fs.writeFileSync(envPath, envContent);

    console.log(`EMPLOYER_MONGO_ID set to: ${employer._id}`);
    console.log(`Employer: ${employer.name} (${employer.email})`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
