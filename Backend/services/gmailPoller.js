const cron = require('node-cron');
const Email = require('../models/Email');
const Customer = require('../models/Customer');
const Employer = require('../models/Employer');
const { fetchUnreadEmails, markAsRead } = require('./gmailService');

let isProcessing = false;
let pollerStartedAt = Math.floor(Date.now() / 1000); // store current time in seconds

const startGmailPoller = () => {
  console.log('Gmail poller started — checking every 30 seconds');

  cron.schedule('*/30 * * * * *', async () => {
    if (isProcessing) {
      console.log('Previous Gmail poll still running, skipping...');
      return;
    }

    try {
      isProcessing = true;
      await processNewEmails();
    } catch (err) {
      console.error('Poller error:', err.message);
    } finally {
      isProcessing = false;
    }
  });
};

const getInboxEmployer = async () => {
  const employer = await Employer.findOne({
    email: process.env.GMAIL_ADDRESS,
    isActive: true,
  });

  if (!employer) {
    throw new Error(`No active employer found for inbox ${process.env.GMAIL_ADDRESS}`);
  }

  return employer;
};

const generateCustomerPassword = () => {
  return `${Math.random().toString(36).slice(-8)}Aa1!`;
};

const processNewEmails = async () => {
  console.log('Checking Gmail...');

  const unreadEmails = await fetchUnreadEmails(pollerStartedAt);

  if (!unreadEmails.length) {
    console.log('No new emails');
    return;
  }

  console.log(`Found ${unreadEmails.length} new email(s)`);

  const employer = await getInboxEmployer();

  for (const email of unreadEmails) {
    try {
      const exists = await Email.findOne({ gmailId: email.gmailId });
      if (exists) {
        await markAsRead(email.gmailId);
        continue;
      }

      let customer = await Customer.findOne({ email: email.fromEmail.toLowerCase(), isActive: true });

      if (!customer) {
        const nameMatch = email.from.match(/^(.+?)\s*</);
        const name = nameMatch ? nameMatch[1].trim() : email.fromEmail.split('@')[0];

        customer = await Customer.create({
          name,
          email: email.fromEmail.toLowerCase(),
          password: generateCustomerPassword(),
        });

        console.log(`New customer saved: ${customer.name} (${email.fromEmail})`);
      }

      await Email.create({
        employerId: employer._id,
        customerId: customer._id,
        gmailId: email.gmailId,
        threadId: email.threadId,
        from: email.from,
        fromEmail: email.fromEmail.toLowerCase(),
        to: email.to,
        subject: email.subject,
        rawBody: email.rawBody,
        body: email.body,
        direction: 'inbound',
        status: 'received',
        emailDate: email.date,
      });

      await markAsRead(email.gmailId);

      console.log(`Saved new email from ${email.fromEmail}`);
    } catch (err) {
      console.error(`Failed processing email ${email.gmailId}:`, err.message);
    }
  }
};

module.exports = { startGmailPoller, processNewEmails };