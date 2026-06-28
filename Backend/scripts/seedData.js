const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('../models/Customer');
const Email = require('../models/Email');
const SocialComplaint = require('../models/SocialComplaint');
const Employer = require('../models/Employer');

async function seedData() {
  try {
    // Use environment variable for MongoDB connection
    const mongoUri = process.env.MONGO_URI || 'mongodb://admin:omnichannel2024@localhost:27017/omnichannel?authSource=admin';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Skip clearing data to avoid auth issues
    console.log('Skipping data clear to avoid auth issues');

    // Create or get sample employer account
    let employer = await Employer.findOne({ email: 'admin@example.com' });
    if (!employer) {
      console.log('Creating sample employer account...');
      employer = await Employer.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        company: 'Demo Company',
        isActive: true
      });
      console.log('Created employer account: admin@example.com / admin123');
    } else {
      console.log('Employer account already exists: admin@example.com / admin123');
    }

    // Get existing customers or create new ones
    let customers = await Customer.find({});
    if (customers.length < 3) {
      console.log('Not enough customers, creating sample customers...');
      await Customer.deleteMany({});
      customers = await Customer.create([
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          phone: '+12345678901',
          language: 'en',
          timezone: 'UTC',
          isActive: true,
          channel_ids: {
            whatsapp: 'whatsapp_john_123',
            chat_uid: 'chat_john_456',
            social_id: 'social_john_789'
          }
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'password123',
          phone: '+19876543210',
          language: 'en',
          timezone: 'UTC',
          isActive: true,
          channel_ids: {
            whatsapp: 'whatsapp_jane_123',
            chat_uid: 'chat_jane_456'
          }
        },
        {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          password: 'password123',
          phone: '+15551234567',
          language: 'en',
          timezone: 'UTC',
          isActive: true,
          channel_ids: {
            email: 'email_bob_123'
          }
        }
      ]);
      console.log(`Created ${customers.length} customers`);
    } else {
      console.log(`Found ${customers.length} existing customers`);
    }

    // Create sample emails (email channel) with correct employerId
    // Delete existing emails and recreate with correct employerId
    await Email.deleteMany({});
    console.log('Deleted existing emails');
    emails = await Email.create([
      {
        employerId: employer._id,
        gmailId: 'gmail_john_123',
        threadId: 'thread_john_456',
        subject: 'Product inquiry',
        body: 'Hi, I have a question about your product',
        fromEmail: 'john@example.com',
        direction: 'inbound',
        emailDate: new Date(Date.now() - 3600000),
        status: 'received',
        customerId: customers[0]._id
      },
      {
        employerId: employer._id,
        gmailId: 'gmail_bob_789',
        threadId: 'thread_bob_012',
        subject: 'Support request',
        body: 'I need help with my account',
        fromEmail: 'bob@example.com',
        direction: 'inbound',
        emailDate: new Date(Date.now() - 7200000),
        status: 'received',
        customerId: customers[2]._id
      }
    ]);
    console.log(`Created ${emails.length} emails`);

    // Create sample social complaints (social channel)
    let socialComplaints = await SocialComplaint.find({});
    if (socialComplaints.length === 0) {
      socialComplaints = await SocialComplaint.create([
        {
          platform: 'twitter',
          keyword: 'service',
          postId: 'twitter_jane_123',
          author: '@janesmith',
          content: 'Great service! Thanks for the help',
          sentiment: 'positive',
          complaintStatus: 'new',
          priority: 'low',
          customerId: customers[1]._id
        },
        {
          platform: 'other',
          keyword: 'update',
          postId: 'social_john_789',
          author: 'johndoe',
          content: 'Having some issues with the latest update',
          sentiment: 'negative',
          complaintStatus: 'new',
          priority: 'high',
          customerId: customers[0]._id
        }
      ]);
      console.log(`Created ${socialComplaints.length} social complaints`);
    } else {
      console.log(`Found ${socialComplaints.length} existing social complaints`);
    }
    console.log('Sample data seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
