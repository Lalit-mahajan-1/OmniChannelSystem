const cron = require('node-cron');
const Email    = require('../models/Email');
const Customer = require('../models/Customer');
const Employer = require('../models/Employer');
const { fetchUnreadEmails, markAsRead } = require('./gmailService');

const startGmailPoller = () => {
  console.log('Gmail poller started — checking every 30 seconds');

  cron.schedule('*/30 * * * * *', async () => {
    try {
      await processNewEmails();
    } catch (err) {
      console.error('Poller error:', err.message);
    }
  });
};

const processNewEmails = async () => {
  console.log('Checking Gmail...');

  const unreadEmails = await fetchUnreadEmails();

  if (unreadEmails.length === 0) {
    console.log('No new emails');
    return;
  }

  console.log(`Found ${unreadEmails.length} new email(s)`);

  for (const email of unreadEmails) {

    // Skip if already saved
    const exists = await Email.findOne({ gmailId: email.gmailId });
    if (exists) {
      await markAsRead(email.gmailId);
      continue;
    }

    // Find or auto-create employer
    let employer = await Employer.findOne({ email: process.env.GMAIL_ADDRESS, isActive: true });
    if (!employer) {
      employer = await Employer.create({
        name:     'Auto Employer',
        email:    process.env.GMAIL_ADDRESS,
        password: 'autopass123456',
      });
      console.log('Auto-created employer');
    }

    // Find or auto-create customer
    let customer = await Customer.findOne({ email: email.fromEmail });
    if (!customer) {
      const nameMatch = email.from.match(/^(.+?)\s*</);
      const name = nameMatch ? nameMatch[1].trim() : email.fromEmail.split('@')[0];

      customer = await Customer.create({
        name,
        email:    email.fromEmail,
        password: Math.random().toString(36).slice(-10) + 'A1',
      });
      console.log(`New customer saved: ${customer.name} (${email.fromEmail})`);
    }

    // Save email to MongoDB
    await Email.create({
      employerId: employer._id,
      customerId: customer._id,
      gmailId:    email.gmailId,
      threadId:   email.threadId,
      from:       email.from,
      fromEmail:  email.fromEmail,
      to:         email.to,
      subject:    email.subject,
      body:       email.body,
      direction:  'inbound',
      status:     'received',
      emailDate:  email.date,
    });

    await markAsRead(email.gmailId);

    console.log('============================');
    console.log('FROM:   ', email.fromEmail);
    console.log('SUBJECT:', email.subject);
    console.log('BODY:   ', email.body);
    console.log('Saved to MongoDB successfully');
    console.log('============================');
  }
};

module.exports = { startGmailPoller };